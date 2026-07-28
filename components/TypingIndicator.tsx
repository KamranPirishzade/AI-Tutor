export function TypingIndicator({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div
      className={`flex w-fit items-center gap-2 rounded-2xl border border-paper-line bg-surface px-3.5 py-2.5 ${className}`}
    >
      <span className="flex items-center gap-1">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-soft" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-soft" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-soft" />
      </span>
      <span className="text-xs text-ink-soft">{label}</span>
    </div>
  );
}
