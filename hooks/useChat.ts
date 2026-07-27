"use client";

import { useMutation } from "@tanstack/react-query";
import { blobToBase64 } from "@/lib/audio";
import type {
  TranscribeRequest,
  TranscribeResponse,
  ChatRequest,
  ChatResponse,
  TtsRequest,
  TtsResponse,
  ChatMessage,
} from "@/types";

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

/** Voice -> text only. Doesn't send anything — the caller decides when the
 * resulting text becomes an actual chat message. */
export function useTranscribe() {
  const mutation = useMutation({
    mutationFn: async (blob: Blob): Promise<string> => {
      const audioBase64 = await blobToBase64(blob);
      const req: TranscribeRequest = { audioBase64, audioMimeType: blob.type };
      const { text } = await postJson<TranscribeResponse>("/api/transcribe", req);
      return text;
    },
  });

  return {
    transcribe: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : undefined,
  };
}

interface SendMessageInput {
  questionText: string;
  currentSlideIndex: number;
  currentSlideNarration: string;
  deckSummary: string;
}

/** Text question -> Gemini answer -> TTS playback. Used for both typed and
 * voice-transcribed messages, since by this point it's just text. */
export function useChat() {
  const mutation = useMutation({
    mutationFn: async ({
      questionText,
      currentSlideIndex,
      currentSlideNarration,
      deckSummary,
    }: SendMessageInput): Promise<ChatMessage> => {
      const chatReq: ChatRequest = {
        questionText,
        currentSlide: { index: currentSlideIndex, narrationText: currentSlideNarration },
        deckSummary,
      };
      const { answerText, focusTerm } = await postJson<ChatResponse>("/api/chat", chatReq);

      const ttsReq: TtsRequest = { text: answerText };
      const { audioBase64 } = await postJson<TtsResponse>("/api/tts", ttsReq);

      new Audio(`data:audio/wav;base64,${audioBase64}`).play().catch(() => {});

      return {
        id: crypto.randomUUID(),
        role: "assistant",
        text: answerText,
        focusTerm,
        audioBase64,
      };
    },
  });

  return {
    sendMessage: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : undefined,
  };
}
