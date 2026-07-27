"use client";

import { useMutation } from "@tanstack/react-query";
import { postJson } from "@/lib/api";
import { blobToBase64 } from "@/lib/encoding";
import type { TranscribeRequest, TranscribeResponse } from "@/types";

/** Sends a recorded audio blob to Gemini and returns the spoken text. This
 * only transcribes — the caller decides what to do with the resulting text
 * (e.g. drop it in a text box for the user to review before sending). */
export function useTranscribeVoice() {
  const mutation = useMutation({
    mutationFn: async (blob: Blob): Promise<string> => {
      const audioBase64 = await blobToBase64(blob);
      const request: TranscribeRequest = { audioBase64, audioMimeType: blob.type };
      const { text } = await postJson<TranscribeResponse>("/api/transcribe", request);
      return text;
    },
  });

  return {
    transcribeVoice: mutation.mutateAsync,
    isTranscribing: mutation.isPending,
  };
}
