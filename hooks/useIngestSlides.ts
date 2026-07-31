"use client";

import { useRef } from "react";
import { useQueries } from "@tanstack/react-query";
import { postJson } from "@/lib/api";
import { createSemaphore } from "@/lib/semaphore";
import { SLIDE_STATUS, SLIDE_IMAGE_MIME_TYPE } from "@/lib/constants";
import type { RenderedSlide } from "@/lib/pdfRender";
import type {
  IngestRequest,
  IngestResponse,
  TtsRequest,
  TtsResponse,
  Slide,
  NarrationFocusPoint,
} from "@/types";

const MAX_CONCURRENT_SLIDE_CHAINS = 2;

async function narrateAndSynthesizeSlide(
  slide: RenderedSlide,
  totalSlides: number
): Promise<{ narrationText: string; focusPoints: NarrationFocusPoint[]; audioBase64: string }> {
  const imageBase64 = slide.dataUrl.split(",")[1];

  const ingestRequest: IngestRequest = {
    imageBase64,
    mimeType: SLIDE_IMAGE_MIME_TYPE,
    slideIndex: slide.index,
    totalSlides,
  };
  const { narrationText, focusPoints } = await postJson<IngestResponse>(
    "/api/ingest",
    ingestRequest
  );

  const ttsRequest: TtsRequest = { text: narrationText };
  const { audioBase64 } = await postJson<TtsResponse>("/api/tts", ttsRequest);

  return { narrationText, focusPoints, audioBase64 };
}

export function useIngestSlides(deckId: string | null, rawSlides: RenderedSlide[]) {
  const semaphoreRef = useRef(createSemaphore(MAX_CONCURRENT_SLIDE_CHAINS));

  const queries = useQueries({
    queries: rawSlides.map((raw) => ({
      queryKey: ["slide", deckId, raw.index],
      queryFn: () => semaphoreRef.current(() => narrateAndSynthesizeSlide(raw, rawSlides.length)),
      enabled: deckId !== null,
    })),
  });

  const slides: Slide[] = rawSlides.map((raw, i) => {
    const query = queries[i];
    let status: Slide["status"] = SLIDE_STATUS.PENDING;
    if (query.isLoading) status = SLIDE_STATUS.NARRATING;
    else if (query.isSuccess) status = SLIDE_STATUS.READY;
    else if (query.isError) status = SLIDE_STATUS.ERROR;

    return {
      index: raw.index,
      imageDataUrl: raw.dataUrl,
      textItems: raw.textItems,
      narrationText: query.data?.narrationText,
      focusPoints: query.data?.focusPoints ?? [],
      audioBase64: query.data?.audioBase64,
      status,
      error: query.error instanceof Error ? query.error.message : undefined,
    };
  });

  const readyCount = slides.filter((s) => s.status === SLIDE_STATUS.READY).length;

  return { slides, readyCount, totalCount: rawSlides.length };
}
