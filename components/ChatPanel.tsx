"use client";

import { useRef, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { getSupportedMimeType } from "@/lib/audio";
import type { ChatMessage } from "@/types";

function renderAnswer(answerText: string, focusTerm: string | null) {
  if (!focusTerm) return answerText;
  const idx = answerText.indexOf(focusTerm);
  if (idx === -1) return answerText;
  return (
    <>
      {answerText.slice(0, idx)}
      <strong>{answerText.slice(idx, idx + focusTerm.length)}</strong>
      {answerText.slice(idx + focusTerm.length)}
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
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { askQuestion, isPending, error } = useChat();

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
          const message = await askQuestion({
            blob,
            currentSlideIndex,
            currentSlideNarration,
            deckSummary,
          });
          setMessages((prev) => [...prev, message]);
        } catch {
          // error surfaced via `error` from useChat below
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

  return (
    <aside className="flex w-80 flex-col gap-3 border-l border-neutral-200 p-4">
      <h2 className="font-semibold">Suallar</h2>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className="rounded bg-neutral-100 p-2 text-sm">
            {renderAnswer(m.answerText, m.focusTerm)}
          </div>
        ))}
        {isPending && <p className="text-sm text-neutral-400">Düşünürəm...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {micError && <p className="text-sm text-red-600">{micError}</p>}
      </div>
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={() => isRecording && stopRecording()}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        className={`rounded-full px-4 py-3 text-white transition ${
          isRecording ? "bg-red-600" : "bg-neutral-800"
        }`}
      >
        {isRecording ? "Buraxın..." : "Basıb saxlayın və soruşun"}
      </button>
    </aside>
  );
}
