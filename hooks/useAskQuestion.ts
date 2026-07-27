"use client";

import { useMutation } from "@tanstack/react-query";
import { postJson } from "@/lib/api";
import type { ChatRequest, ChatResponse, TtsRequest, TtsResponse, ChatMessage } from "@/types";

interface AskQuestionInput {
  questionText: string;
  currentSlideIndex: number;
  currentSlideNarration: string;
  deckSummary: string;
}

/** Sends a text question to Gemini and speaks the answer aloud. Used for both
 * typed and voice-transcribed questions, since by this point it's just text. */
export function useAskQuestion() {
  const mutation = useMutation({
    mutationFn: async ({
      questionText,
      currentSlideIndex,
      currentSlideNarration,
      deckSummary,
    }: AskQuestionInput): Promise<ChatMessage> => {
      const chatRequest: ChatRequest = {
        questionText,
        currentSlide: { index: currentSlideIndex, narrationText: currentSlideNarration },
        deckSummary,
      };
      const { answerText, focusTerm } = await postJson<ChatResponse>("/api/chat", chatRequest);

      const ttsRequest: TtsRequest = { text: answerText };
      const { audioBase64 } = await postJson<TtsResponse>("/api/tts", ttsRequest);

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
    askQuestion: mutation.mutateAsync,
    isAnswering: mutation.isPending,
  };
}
