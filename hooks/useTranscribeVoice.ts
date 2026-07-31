"use client";

import { useMutation } from "@tanstack/react-query";
import { postJson } from "@/lib/api";
import { blobToBase64 } from "@/lib/encoding";
import type { TranscribeRequest, TranscribeResponse } from "@/types";

interface TranscribeVoiceInput {
  blob: Blob;
  contextText?: string;
}

export function useTranscribeVoice() {
  const mutation = useMutation({
    mutationFn: async ({ blob, contextText }: TranscribeVoiceInput): Promise<string> => {
      const audioBase64 = await blobToBase64(blob);
      const request: TranscribeRequest = { audioBase64, audioMimeType: blob.type, contextText };
      const { text } = await postJson<TranscribeResponse>("/api/transcribe", request);
      return text;
    },
  });

  return {
    transcribeVoice: mutation.mutateAsync,
    isTranscribing: mutation.isPending,
  };
}
