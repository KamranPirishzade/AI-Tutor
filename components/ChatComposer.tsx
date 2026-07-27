"use client";

import { Mic, Square, Send } from "lucide-react";

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
        className="flex-1 resize-none rounded-xl border border-paper-line bg-surface p-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:border-margin focus:outline-none"
      />
      <button
        onMouseDown={onStartRecording}
        onMouseUp={onStopRecording}
        onMouseLeave={() => isRecording && onStopRecording()}
        onTouchStart={onStartRecording}
        onTouchEnd={onStopRecording}
        aria-label={isRecording ? "Yazını buraxın" : "Səsli sual verin"}
        className={`flex shrink-0 items-center justify-center rounded-full p-2.5 transition ${
          isRecording
            ? "bg-margin text-white"
            : "border border-ink-soft/30 bg-surface text-ink hover:border-margin hover:text-margin"
        }`}
      >
        {isRecording ? <Square size={17} /> : <Mic size={17} />}
      </button>
      <button
        onClick={onSend}
        disabled={!inputText.trim()}
        aria-label="Göndər"
        className="flex shrink-0 items-center justify-center rounded-full bg-highlight p-2.5 text-highlight-ink transition disabled:opacity-40"
      >
        <Send size={17} />
      </button>
    </div>
  );
}
