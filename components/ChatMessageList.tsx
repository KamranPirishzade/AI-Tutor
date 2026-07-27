import { ChatMessageBubble } from "./ChatMessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { ChatMessage } from "@/types";

export function ChatMessageList({
  messages,
  isTranscribing,
  isAnswering,
}: {
  messages: ChatMessage[];
  isTranscribing: boolean;
  isAnswering: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
      {messages.length === 0 && (
        <p className="mt-8 text-center text-sm text-ink-soft">
          Slaydla bağlı sualınız var? Yazın və ya səsli soruşun.
        </p>
      )}
      {messages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
      ))}
      {isTranscribing && <TypingIndicator label="Səs mətnə çevrilir" />}
      {isAnswering && <TypingIndicator label="Düşünürəm" />}
    </div>
  );
}
