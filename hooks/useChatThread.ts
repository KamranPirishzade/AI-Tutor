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
}

/** Owns the entire chat feature: the message thread, the text input, and
 * both ways a message gets composed — typed directly, or recorded and
 * transcribed into the same input box for review before sending. */
export function useChatThread(context: ChatThreadContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");

  const { isRecording, startRecording, stopRecording } = useVoiceRecorder();
  const { transcribeVoice, isTranscribing } = useTranscribeVoice();
  const { askQuestion, isAnswering } = useAskQuestion();

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

    setInputText("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: questionText }]);

    try {
      const assistantMessage = await askQuestion({ questionText, ...context });
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suala cavab verərkən xəta baş verdi.");
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
