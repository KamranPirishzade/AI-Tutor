import type { ChatMessage } from "@/types";

function withFocusTermBolded(text: string, focusTerm?: string | null) {
  if (!focusTerm) return text;
  const matchIndex = text.indexOf(focusTerm);
  if (matchIndex === -1) return text;

  return (
    <>
      {text.slice(0, matchIndex)}
      <strong>{text.slice(matchIndex, matchIndex + focusTerm.length)}</strong>
      {text.slice(matchIndex + focusTerm.length)}
    </>
  );
}

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUserMessage = message.role === "user";

  return (
    <div
      className={`max-w-[85%] rounded p-2 text-sm ${
        isUserMessage
          ? "self-end bg-neutral-800 text-white"
          : "self-start bg-neutral-100 dark:bg-neutral-800"
      }`}
    >
      {isUserMessage ? message.text : withFocusTermBolded(message.text, message.focusTerm)}
    </div>
  );
}
