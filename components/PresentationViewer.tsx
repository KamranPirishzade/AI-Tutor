"use client";

import { useEffect, useRef, useState } from "react";
import type { Slide } from "@/types";

export function PresentationViewer({
  slides,
  onIndexChange,
}: {
  slides: Slide[];
  onIndexChange?: (index: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = slides[currentIndex];

  useEffect(() => {
    onIndexChange?.(currentIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    if (!current?.audioBase64 || paused) return;

    const audio = new Audio(`data:audio/wav;base64,${current.audioBase64}`);
    audioRef.current = audio;
    audio.onended = () => {
      setCurrentIndex((i) => (i + 1 < slides.length ? i + 1 : i));
    };
    audio.play().catch(() => {
      // Autoplay can be blocked before any user gesture on the page —
      // the Pauza/Davam et button doubles as a manual retry in that case.
    });

    return () => {
      audio.pause();
      audio.onended = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.audioBase64, paused]);

  if (!current) return null;

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.imageDataUrl}
        alt={`Slayd ${current.index + 1}`}
        className="w-full rounded border border-neutral-300 dark:border-neutral-700"
      />
      <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
        <span>
          Slayd {current.index + 1} / {slides.length}
        </span>
        {current.status !== "ready" && <span>Slayd hazırlanır...</span>}
        {current.status === "error" && (
          <span className="text-red-600">Xəta: {current.error}</span>
        )}
        <button
          onClick={() => setPaused((p) => !p)}
          className="rounded bg-neutral-800 px-3 py-1 text-white"
        >
          {paused ? "Davam et" : "Pauza"}
        </button>
      </div>
    </div>
  );
}
