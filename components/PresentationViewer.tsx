"use client";

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
        className="w-full rounded border border-neutral-300 dark:border-neutral-700"
      />
      <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
        <span>
          Slayd {currentSlide.index + 1} / {slides.length}
        </span>
        {currentSlide.status !== "ready" && <span>Slayd hazırlanır...</span>}
        {currentSlide.status === "error" && (
          <span className="text-red-600">Xəta: {currentSlide.error}</span>
        )}
        <button
          onClick={togglePause}
          className="rounded bg-neutral-800 px-3 py-1 text-white"
        >
          {isPaused ? "Davam et" : "Pauza"}
        </button>
      </div>
    </div>
  );
}
