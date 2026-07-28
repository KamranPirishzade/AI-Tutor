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
}: ChatThreadContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");

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
      const transcript = await transcribeVoice(recordedAudio);
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Səsi mətnə çevirərkən xəta baş verdi.");
    }
  }

  async function handleSend() {
    const questionText = inputText.trim();
    if (!questionText) return;

    onQuestionSent?.();
    setInputText("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: questionText }]);

    try {
      const assistantMessage = await askQuestion({
        questionText,
        currentSlideIndex,
        currentSlideNarration,
        deckSummary,
      });
      setMessages((prev) => [...prev, assistantMessage]);
      playAnswer(assistantMessage.audioBase64);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suala cavab verərkən xəta baş verdi.");
      onAnswerPlaybackEnd?.();
    }
  }

  return {
    messages,
    inputText,
    setInputText,
    isRecording,
    isTranscribing,
    isAnswering,
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording,
    handleSend,
  };
}
