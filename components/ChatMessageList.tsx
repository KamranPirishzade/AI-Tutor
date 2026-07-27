import { ChatMessageBubble } from "./ChatMessageBubble";
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
      {messages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
      ))}
      {isTranscribing && <p className="text-sm text-neutral-400">Səs mətnə çevrilir...</p>}
      {isAnswering && <p className="text-sm text-neutral-400">Düşünürəm...</p>}
    </div>
  );
}
