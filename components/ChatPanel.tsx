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
  onFocusChange,
}: {
  currentSlideIndex: number;
  currentSlideNarration: string;
  deckSummary: string;
  onQuestionSent?: () => void;
  onAnswerPlaybackEnd?: () => void;
  onFocusChange?: (focus: { term: string | null; relevantSlideNumber: number | null }) => void;
}) {
  const {
    messages,
    inputText,
    setInputText,
    isRecording,
    isTranscribing,
    isThinking,
    isPreparingAudio,
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
    onFocusChange,
  });

  return (
    <aside className="flex w-80 flex-col gap-3 p-4">
      <h2 className="font-display text-sm font-semibold tracking-wide text-ink-soft uppercase">
        Suallar
      </h2>
      <ChatMessageList
        messages={messages}
        isTranscribing={isTranscribing}
        isThinking={isThinking}
        isPreparingAudio={isPreparingAudio}
      />
      <ChatComposer
        inputText={inputText}
        onInputTextChange={setInputText}
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onSend={handleSend}
        disabled={isAnswering}
      />
    </aside>
  );
}
