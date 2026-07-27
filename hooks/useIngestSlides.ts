"use client";

import { useRef } from "react";
import { useQueries } from "@tanstack/react-query";
import { createSemaphore } from "@/lib/concurrency";
import type { RenderedSlide } from "@/lib/pdfRender";
import type { IngestRequest, IngestResponse, TtsRequest, TtsResponse, Slide } from "@/types";

// Free-tier Gemini RPM is low; each slide needs 2 sequential calls
// (narrate, then TTS), so a naive Promise.all over a whole deck would
// mostly 429. Cap how many slide chains run at once instead.
const MAX_CONCURRENT_SLIDE_CHAINS = 2;

async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.error ?? `Server xətası (${res.status}). Yenidən cəhd edin.`);
  }
  return res.json() as Promise<TResponse>;
}

async function ingestAndSynthesize(
  slide: RenderedSlide,
  totalSlides: number
): Promise<{ narrationText: string; audioBase64: string }> {
  const base64 = slide.dataUrl.split(",")[1];

  const ingestReq: IngestRequest = {
    imageBase64: base64,
    mimeType: "image/jpeg",
    slideIndex: slide.index,
    totalSlides,
  };
  const { narrationText } = await postJson<IngestResponse>("/api/ingest", ingestReq);

  const ttsReq: TtsRequest = { text: narrationText };
  const { audioBase64 } = await postJson<TtsResponse>("/api/tts", ttsReq);

  return { narrationText, audioBase64 };
}

export function useIngestSlides(deckId: string | null, rawSlides: RenderedSlide[]) {
  const semaphoreRef = useRef(createSemaphore(MAX_CONCURRENT_SLIDE_CHAINS));

  const queries = useQueries({
    queries: rawSlides.map((raw) => ({
      queryKey: ["slide", deckId, raw.index],
      queryFn: () => semaphoreRef.current(() => ingestAndSynthesize(raw, rawSlides.length)),
      enabled: deckId !== null,
    })),
  });

  const slides: Slide[] = rawSlides.map((raw, i) => {
    const q = queries[i];
    let status: Slide["status"] = "pending";
    if (q.isLoading) status = "narrating";
    else if (q.isSuccess) status = "ready";
    else if (q.isError) status = "error";

    return {
      index: raw.index,
      imageDataUrl: raw.dataUrl,
      narrationText: q.data?.narrationText,
      audioBase64: q.data?.audioBase64,
      status,
      error: q.error instanceof Error ? q.error.message : undefined,
    };
  });

  const readyCount = slides.filter((s) => s.status === "ready").length;

  return { slides, readyCount, totalCount: rawSlides.length };
}
