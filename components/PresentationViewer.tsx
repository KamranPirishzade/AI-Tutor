"use client";

import { Pause, Play } from "lucide-react";
import { useSlideAudioPlayer } from "@/hooks/useSlideAudioPlayer";
import type { Slide } from "@/types";

export function PresentationViewer({
  slides,
  onIndexChange,
}: {
  slides: Slide[];
  onIndexChange?: (index: number) => void;
}) {
  const { currentSlide, isPaused, togglePause } = useSlideAudioPlayer(slides, onIndexChange);

  if (!currentSlide) return null;

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentSlide.imageDataUrl}
        alt={`Slayd ${currentSlide.index + 1}`}
        className="w-full rounded-2xl border border-paper-line bg-surface shadow-sm"
      />
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs tracking-wide text-ink-soft">
          {String(currentSlide.index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </span>

        {currentSlide.status !== "ready" && (
          <span className="flex items-center gap-1.5 text-xs text-ink-soft">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-margin" />
            Slayd hazırlanır...
          </span>
        )}
        {currentSlide.status === "error" && (
          <span className="text-xs text-margin">Xəta: {currentSlide.error}</span>
        )}

        <button
          onClick={togglePause}
          aria-label={isPaused ? "Davam et" : "Pauza"}
          className="flex items-center gap-1.5 rounded-full border border-ink-soft/30 bg-surface px-4 py-1.5 text-sm text-ink transition hover:border-margin hover:text-margin"
        >
          {isPaused ? <Play size={15} /> : <Pause size={15} />}
          {isPaused ? "Davam et" : "Pauza"}
        </button>
      </div>
    </div>
  );
}
