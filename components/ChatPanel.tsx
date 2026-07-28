"use client";

import { useChatThread } from "@/hooks/useChatThread";
import { ChatMessageList } from "./ChatMessageList";
import { ChatComposer } from "./ChatComposer";

export function ChatPanel({
  currentSlideIndex,
  currentSlideNarration,
  deckSummary,
  onQuestionSent,
  onAnswerPlaybackEnd,
}: {
  currentSlideIndex: number;
  currentSlideNarration: string;
  deckSummary: string;
  onQuestionSent?: () => void;
  onAnswerPlaybackEnd?: () => void;
}) {
  const {
    messages,
    inputText,
    setInputText,
    isRecording,
    isTranscribing,
    isAnswering,
    startRecording,
    stopRecording,
    handleSend,
  } = useChatThread({
    currentSlideIndex,
    currentSlideNarration,
    deckSummary,
    onQuestionSent,
    onAnswerPlaybackEnd,
  });

  return (
    <aside className="flex w-80 flex-col gap-3 p-4">
      <h2 className="font-display text-sm font-semibold tracking-wide text-ink-soft uppercase">
        Suallar
      </h2>
      <ChatMessageList
        messages={messages}
        isTranscribing={isTranscribing}
        isAnswering={isAnswering}
      />
      <ChatComposer
        inputText={inputText}
        onInputTextChange={setInputText}
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onSend={handleSend}
      />
    </aside>
  );
}
