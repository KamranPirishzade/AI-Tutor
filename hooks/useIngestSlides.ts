"use client";

import { useRef } from "react";
import { useQueries } from "@tanstack/react-query";
import { postJson } from "@/lib/api";
import { createSemaphore } from "@/lib/semaphore";
import type { RenderedSlide } from "@/lib/pdfRender";
import type { IngestRequest, IngestResponse, TtsRequest, TtsResponse, Slide } from "@/types";

// Free-tier Gemini RPM is low; each slide needs 2 sequential calls
// (narrate, then TTS), so a naive Promise.all over a whole deck would
// mostly 429. Cap how many slide chains run at once instead.
const MAX_CONCURRENT_SLIDE_CHAINS = 2;

async function narrateAndSynthesizeSlide(
  slide: RenderedSlide,
  totalSlides: number
): Promise<{ narrationText: string; audioBase64: string }> {
  const imageBase64 = slide.dataUrl.split(",")[1];

  const ingestRequest: IngestRequest = {
    imageBase64,
    mimeType: "image/jpeg",
    slideIndex: slide.index,
    totalSlides,
  };
  const { narrationText } = await postJson<IngestResponse>("/api/ingest", ingestRequest);

  const ttsRequest: TtsRequest = { text: narrationText };
  const { audioBase64 } = await postJson<TtsResponse>("/api/tts", ttsRequest);

  return { narrationText, audioBase64 };
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
    let status: Slide["status"] = "pending";
    if (query.isLoading) status = "narrating";
    else if (query.isSuccess) status = "ready";
    else if (query.isError) status = "error";

    return {
      index: raw.index,
      imageDataUrl: raw.dataUrl,
      textItems: raw.textItems,
      narrationText: query.data?.narrationText,
      audioBase64: query.data?.audioBase64,
      status,
      error: query.error instanceof Error ? query.error.message : undefined,
    };
  });

  const readyCount = slides.filter((s) => s.status === "ready").length;

  return { slides, readyCount, totalCount: rawSlides.length };
}
