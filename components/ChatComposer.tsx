"use client";

export function ChatComposer({
  inputText,
  onInputTextChange,
  isRecording,
  onStartRecording,
  onStopRecording,
  onSend,
}: {
  inputText: string;
  onInputTextChange: (text: string) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSend: () => void;
}) {
  return (
    <div className="flex items-end gap-2">
      <textarea
        value={inputText}
        onChange={(e) => onInputTextChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder="Sualınızı yazın..."
        rows={1}
        className="flex-1 resize-none rounded border border-neutral-300 p-2 text-sm dark:border-neutral-600 dark:bg-neutral-900"
      />
      <button
        onMouseDown={onStartRecording}
        onMouseUp={onStopRecording}
        onMouseLeave={() => isRecording && onStopRecording()}
        onTouchStart={onStartRecording}
        onTouchEnd={onStopRecording}
        className={`shrink-0 rounded px-3 py-2 text-sm text-white ${
          isRecording ? "bg-red-600" : "bg-neutral-700"
        }`}
      >
        {isRecording ? "Buraxın" : "Səs"}
      </button>
      <button
        onClick={onSend}
        disabled={!inputText.trim()}
        className="shrink-0 rounded bg-neutral-800 px-3 py-2 text-sm text-white disabled:opacity-40"
      >
        Göndər
      </button>
    </div>
  );
}
