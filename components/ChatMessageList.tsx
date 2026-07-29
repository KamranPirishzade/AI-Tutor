import { ChatMessageBubble } from "./ChatMessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { ChatMessage } from "@/types";

export function ChatMessageList({
  messages,
  isTranscribing,
  isThinking,
}: {
  messages: ChatMessage[];
  isTranscribing: boolean;
  isThinking: boolean;
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
      {isTranscribing && <TypingIndicator label="Səs mətnə çevrilir" className="self-start" />}
      {isThinking && <TypingIndicator label="Düşünürəm" className="self-start" />}
    </div>
  );
}
