"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { useTranscribeVoice } from "./useTranscribeVoice";
import { useAskQuestion } from "./useAskQuestion";
import { toAudioDataUri } from "@/lib/audioDataUri";
import { MESSAGES } from "@/lib/messages";
import type { ChatMessage } from "@/types";

interface ChatThreadContext {
  currentSlideIndex: number;
  currentSlideNarration: string;
  deckSummary: string;
  onQuestionSent?: () => void;
  onAnswerPlaybackEnd?: () => void;
  onFocusChange?: (focus: { term: string | null; relevantSlideNumber: number | null }) => void;
}

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
  const [isThinking, setIsThinking] = useState(false);
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);

  const { isRecording, startRecording, stopRecording } = useVoiceRecorder();
  const { transcribeVoice, isTranscribing } = useTranscribeVoice();
  const { askQuestion, isAnswering } = useAskQuestion();

  function playAnswer(audioBase64: string | undefined) {
    if (!audioBase64) {
      onAnswerPlaybackEnd?.();
      return;
    }
    const audio = new Audio(toAudioDataUri(audioBase64));
    audio.onended = () => onAnswerPlaybackEnd?.();
    audio.play().catch(() => onAnswerPlaybackEnd?.());
  }

  async function handleStartRecording() {
    try {
      await startRecording();
    } catch {
      toast.error(MESSAGES.voice.micPermissionDenied);
    }
  }

  async function handleStopRecording() {
    const recordedAudio = await stopRecording();
    try {
      const contextText = `Hazırkı slaydın izahı: ${currentSlideNarration}\n\nTəqdimatın xülasəsi:\n${deckSummary}`;
      const transcript = await transcribeVoice({ blob: recordedAudio, contextText });
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : MESSAGES.voice.transcribeFailed);
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
      toast.error(err instanceof Error ? err.message : MESSAGES.chat.answerFailed);
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
