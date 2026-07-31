import type { ChatMessage } from "@/types";

function withFocusTermHighlighted(text: string, focusTerm?: string | null) {
  if (!focusTerm) return text;
  const matchIndex = text.indexOf(focusTerm);
  if (matchIndex === -1) return text;

  return (
    <>
      {text.slice(0, matchIndex)}
      <span className="highlighter-mark font-medium text-highlight-ink">
        {text.slice(matchIndex, matchIndex + focusTerm.length)}
      </span>
      {text.slice(matchIndex + focusTerm.length)}
    </>
  );
}

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUserMessage = message.role === "user";

  return (
    <div
      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
        isUserMessage
          ? "self-end bg-ink text-paper"
          : "self-start border border-paper-line bg-surface text-ink"
      }`}
    >
      {isUserMessage ? message.text : withFocusTermHighlighted(message.text, message.focusTerm)}
    </div>
  );
}
