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
  /** Called with the accumulated answer text after every streamed chunk,
   * so the caller can render it growing in real time. */
  onTextChunk: (accumulatedText: string) => void;
  /** Called once the streamed answer text is fully known, right before the
   * focus-info and TTS calls start — TTS alone regularly takes several
   * seconds, and with the text already fully visible on screen by this
   * point, that wait would otherwise pass with no indication anything is
   * still happening. */
  onTextComplete?: () => void;
}

/** Sends a text question to Gemini and returns the spoken answer's text and
 * audio. Used for both typed and voice-transcribed questions, since by this
 * point it's just text. Doesn't play the audio itself — see useChatThread,
 * which coordinates playback with the slide narration so they don't overlap.
 *
 * The answer text streams in progressively (via /api/chat) so the chat
 * bubble can grow as it arrives instead of waiting for the whole answer.
 * Once the full text is known, the highlight/navigation info and the TTS
 * audio are fetched at the same time — TTS only ever needed the complete
 * text anyway, so fetching both together adds no delay to when audio starts. */
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
