"use client";

import { useMutation } from "@tanstack/react-query";
import { blobToBase64 } from "@/lib/audio";
import type { ChatRequest, ChatResponse, TtsRequest, TtsResponse, ChatMessage } from "@/types";

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

interface AskQuestionInput {
  blob: Blob;
  currentSlideIndex: number;
  currentSlideNarration: string;
  deckSummary: string;
}

export function useChat() {
  const mutation = useMutation({
    mutationFn: async ({
      blob,
      currentSlideIndex,
      currentSlideNarration,
      deckSummary,
    }: AskQuestionInput): Promise<ChatMessage> => {
      const audioBase64 = await blobToBase64(blob);

      const chatReq: ChatRequest = {
        audioBase64,
        audioMimeType: blob.type,
        currentSlide: { index: currentSlideIndex, narrationText: currentSlideNarration },
        deckSummary,
      };
      const { answerText, focusTerm } = await postJson<ChatResponse>("/api/chat", chatReq);

      const ttsReq: TtsRequest = { text: answerText };
      const { audioBase64: replyAudioBase64 } = await postJson<TtsResponse>("/api/tts", ttsReq);

      new Audio(`data:audio/wav;base64,${replyAudioBase64}`).play().catch(() => {});

      return {
        id: crypto.randomUUID(),
        answerText,
        focusTerm,
        audioBase64: replyAudioBase64,
      };
    },
  });

  return {
    askQuestion: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : undefined,
  };
}
