"use client";

import { useRef, useState } from "react";
import { useChat, useTranscribe } from "@/hooks/useChat";
import { getSupportedMimeType } from "@/lib/audio";
import type { ChatMessage } from "@/types";

function renderAnswer(text: string, focusTerm?: string | null) {
  if (!focusTerm) return text;
  const idx = text.indexOf(focusTerm);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong>{text.slice(idx, idx + focusTerm.length)}</strong>
      {text.slice(idx + focusTerm.length)}
    </>
  );
}

export function ChatPanel({
  currentSlideIndex,
  currentSlideNarration,
  deckSummary,
}: {
  currentSlideIndex: number;
  currentSlideNarration: string;
  deckSummary: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { sendMessage, isPending: isAnswering, error: chatError } = useChat();
  const { transcribe, isPending: isTranscribing, error: transcribeError } = useTranscribe();

  async function startRecording() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        try {
          const text = await transcribe(blob);
          setInputText((prev) => (prev ? `${prev} ${text}` : text));
        } catch {
          // error surfaced via transcribeError below
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setMicError("Mikrofona giriş əldə edilmədi. Brauzer icazələrini yoxlayın.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  async function handleSend() {
    const text = inputText.trim();
    if (!text) return;

    setInputText("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);

    try {
      const assistantMessage = await sendMessage({
        questionText: text,
        currentSlideIndex,
        currentSlideNarration,
        deckSummary,
      });
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      // error surfaced via chatError below
    }
  }

  return (
    <aside className="flex w-80 flex-col gap-3 border-l border-neutral-200 p-4 dark:border-neutral-700">
      <h2 className="font-semibold">Suallar</h2>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded p-2 text-sm ${
              m.role === "user"
                ? "self-end bg-neutral-800 text-white"
                : "self-start bg-neutral-100 dark:bg-neutral-800"
            }`}
          >
            {m.role === "assistant" ? renderAnswer(m.text, m.focusTerm) : m.text}
          </div>
        ))}
        {isTranscribing && <p className="text-sm text-neutral-400">Səs mətnə çevrilir...</p>}
        {isAnswering && <p className="text-sm text-neutral-400">Düşünürəm...</p>}
        {chatError && <p className="text-sm text-red-600">{chatError}</p>}
        {transcribeError && <p className="text-sm text-red-600">{transcribeError}</p>}
        {micError && <p className="text-sm text-red-600">{micError}</p>}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Sualınızı yazın..."
          rows={1}
          className="flex-1 resize-none rounded border border-neutral-300 p-2 text-sm dark:border-neutral-600 dark:bg-neutral-900"
        />
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={() => isRecording && stopRecording()}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className={`shrink-0 rounded px-3 py-2 text-sm text-white ${
            isRecording ? "bg-red-600" : "bg-neutral-700"
          }`}
        >
          {isRecording ? "Buraxın" : "Səs"}
        </button>
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="shrink-0 rounded bg-neutral-800 px-3 py-2 text-sm text-white disabled:opacity-40"
        >
          Göndər
        </button>
      </div>
    </aside>
  );
}
