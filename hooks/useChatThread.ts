"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { useTranscribeVoice } from "./useTranscribeVoice";
import { useAskQuestion } from "./useAskQuestion";
import type { ChatMessage } from "@/types";

interface ChatThreadContext {
  currentSlideIndex: number;
  currentSlideNarration: string;
  deckSummary: string;
  /** Called the moment a question is sent — lets the caller silence the
   * slide narration so it doesn't play over the answer. */
  onQuestionSent?: () => void;
  /** Called once the answer has finished playing (or failed to play at
   * all) — the caller's cue that it's safe to resume the narration. */
  onAnswerPlaybackEnd?: () => void;
  /** Called with the latest answer's focus term and which slide it's
   * actually about, so the caller can navigate there and highlight it —
   * cleared the moment a new question starts. */
  onFocusChange?: (focus: { term: string | null; relevantSlideNumber: number | null }) => void;
}

/** Owns the entire chat feature: the message thread, the text input, both
 * ways a message gets composed — typed directly, or recorded and
 * transcribed into the same input box for review before sending — and
 * playback of the answer's audio. */
export function useChatThread({
  currentSlideIndex,
  currentSlideNarration,
  deckSummary,
  onQuestionSent,
  onAnswerPlaybackEnd,
  onFocusChange,
}: ChatThreadContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  // True only while waiting for the first chunk of a streamed answer — once
  // text starts arriving, the growing bubble itself is the "it's working"
  // signal.
  const [isThinking, setIsThinking] = useState(false);
  // True from the moment the streamed text finishes until audio playback
  // actually starts. TTS generation alone regularly takes several seconds
  // (see lib/gemini/speech.ts) — without this, that wait passes silently
  // right after the full answer is already visible, which reads as "nothing
  // is happening" until the audio suddenly starts.
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);

  const { isRecording, startRecording, stopRecording } = useVoiceRecorder();
  const { transcribeVoice, isTranscribing } = useTranscribeVoice();
  const { askQuestion, isAnswering } = useAskQuestion();

  function playAnswer(audioBase64: string | undefined) {
    if (!audioBase64) {
      onAnswerPlaybackEnd?.();
      return;
    }
    const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
    audio.onended = () => onAnswerPlaybackEnd?.();
    audio.play().catch(() => onAnswerPlaybackEnd?.());
  }

  async function handleStartRecording() {
    try {
      await startRecording();
    } catch {
      toast.error("Mikrofona giriş əldə edilmədi. Brauzer icazələrini yoxlayın.");
    }
  }

  async function handleStopRecording() {
    const recordedAudio = await stopRecording();
    try {
      const contextText = `Hazırkı slaydın izahı: ${currentSlideNarration}\n\nTəqdimatın xülasəsi:\n${deckSummary}`;
      const transcript = await transcribeVoice({ blob: recordedAudio, contextText });
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Səsi mətnə çevirərkən xəta baş verdi.");
    }
  }

  async function handleSend() {
    const questionText = inputText.trim();
    if (!questionText || isAnswering) return;

    onQuestionSent?.();
    onFocusChange?.({ term: null, relevantSlideNumber: null });
    setInputText("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: questionText }]);
    setIsThinking(true);

    // The assistant bubble itself isn't added until the first chunk of the
    // streamed answer arrives (see handleAnswerChunk) — until then, the
    // typing indicator alone shows something is happening.
    const assistantMessageId = crypto.randomUUID();
    let assistantMessageAdded = false;

    function handleAnswerChunk(accumulatedText: string) {
      setIsThinking(false);
      setMessages((prev) => {
        if (!assistantMessageAdded) {
          assistantMessageAdded = true;
          return [...prev, { id: assistantMessageId, role: "assistant", text: accumulatedText }];
        }
        return prev.map((message) =>
          message.id === assistantMessageId ? { ...message, text: accumulatedText } : message
        );
      });
    }

    try {
      const assistantMessage = await askQuestion({
        questionText,
        currentSlideIndex,
        currentSlideNarration,
        deckSummary,
        onTextChunk: handleAnswerChunk,
        onTextComplete: () => setIsPreparingAudio(true),
      });
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId ? { ...assistantMessage, id: assistantMessageId } : message
        )
      );
      onFocusChange?.({
        term: assistantMessage.focusTerm ?? null,
        relevantSlideNumber: assistantMessage.relevantSlideNumber ?? null,
      });
      playAnswer(assistantMessage.audioBase64);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suala cavab verərkən xəta baş verdi.");
      setMessages((prev) => prev.filter((message) => message.id !== assistantMessageId));
      onAnswerPlaybackEnd?.();
    } finally {
      setIsThinking(false);
      setIsPreparingAudio(false);
    }
  }

  return {
    messages,
    inputText,
    setInputText,
    isRecording,
    isTranscribing,
    isThinking,
    isPreparingAudio,
    isAnswering,
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording,
    handleSend,
  };
}
