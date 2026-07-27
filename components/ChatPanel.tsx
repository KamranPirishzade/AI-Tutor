"use client";

import { useChatThread } from "@/hooks/useChatThread";
import { ChatMessageList } from "./ChatMessageList";
import { ChatComposer } from "./ChatComposer";

export function ChatPanel({
  currentSlideIndex,
  currentSlideNarration,
  deckSummary,
}: {
  currentSlideIndex: number;
  currentSlideNarration: string;
  deckSummary: string;
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
  } = useChatThread({ currentSlideIndex, currentSlideNarration, deckSummary });

  return (
    <aside className="flex w-80 flex-col gap-3 border-l border-neutral-200 p-4 dark:border-neutral-700">
      <h2 className="font-semibold">Suallar</h2>
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
