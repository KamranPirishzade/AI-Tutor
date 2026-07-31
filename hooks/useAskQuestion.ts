"use client";

import { useMutation } from "@tanstack/react-query";
import { postJson, streamText } from "@/lib/api";
import type {
  ChatRequest,
  ChatFocusRequest,
  ChatFocusInfo,
  TtsRequest,
  TtsResponse,
  ChatMessage,
} from "@/types";

interface AskQuestionInput {
  questionText: string;
  currentSlideIndex: number;
  currentSlideNarration: string;
  deckSummary: string;
  onTextChunk: (accumulatedText: string) => void;
  onTextComplete?: () => void;
}

export function useAskQuestion() {
  const mutation = useMutation({
    mutationFn: async ({
      questionText,
      currentSlideIndex,
      currentSlideNarration,
      deckSummary,
      onTextChunk,
      onTextComplete,
    }: AskQuestionInput): Promise<ChatMessage> => {
      const chatRequest: ChatRequest = {
        questionText,
        currentSlide: { index: currentSlideIndex, narrationText: currentSlideNarration },
        deckSummary,
      };
      const answerText = await streamText("/api/chat", chatRequest, onTextChunk);
      onTextComplete?.();

      const focusRequest: ChatFocusRequest = {
        questionText,
        answerText,
        currentSlideNarration,
        deckSummary,
      };
      const ttsRequest: TtsRequest = { text: answerText };

      const [focusInfo, ttsResponse] = await Promise.all([
        postJson<ChatFocusInfo>("/api/chat/focus", focusRequest),
        postJson<TtsResponse>("/api/tts", ttsRequest),
      ]);

      return {
        id: crypto.randomUUID(),
        role: "assistant",
        text: answerText,
        focusTerm: focusInfo.focusTerm,
        relevantSlideNumber: focusInfo.relevantSlideNumber,
        audioBase64: ttsResponse.audioBase64,
      };
    },
  });

  return {
    askQuestion: mutation.mutateAsync,
    isAnswering: mutation.isPending,
  };
}
