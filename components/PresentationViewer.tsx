"use client";

import { ChevronLeft, ChevronRight, Pause, Play, Undo2 } from "lucide-react";
import { TypingIndicator } from "./TypingIndicator";
import { SLIDE_STATUS } from "@/lib/constants";
import type { HighlightBox } from "@/lib/findFocusHighlight";
import type { Slide } from "@/types";

export function PresentationViewer({
  slides,
  currentSlide,
  isPaused,
  togglePause,
  goToPrevious,
  goToNext,
  hasPrevious,
  hasNext,
  activeFocusTerm,
  highlightBox,
  returnToSlideIndex,
}: {
  slides: Slide[];
  currentSlide: Slide | undefined;
  isPaused: boolean;
  togglePause: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  activeFocusTerm?: string | null;
  highlightBox: HighlightBox | null;
  returnToSlideIndex?: number | null;
}) {
  if (!currentSlide) return null;

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <div className="relative w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={currentSlide.index}
          src={currentSlide.imageDataUrl}
          alt={`Slayd ${currentSlide.index + 1}`}
          className="slide-fade-in w-full rounded-2xl border border-paper-line bg-surface shadow-sm"
        />

        {highlightBox && (
          <div
            key={activeFocusTerm}
            className="highlighter-mark-box pointer-events-none absolute rounded-sm"
            style={{
              left: `${highlightBox.left * 100}%`,
              top: `${highlightBox.top * 100}%`,
              width: `${highlightBox.width * 100}%`,
              height: `${highlightBox.height * 100}%`,
            }}
          />
        )}

        {currentSlide.status !== SLIDE_STATUS.READY && currentSlide.status !== SLIDE_STATUS.ERROR && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-surface/60 backdrop-blur-[1px]">
            <TypingIndicator label="AI slaydı hazırlayır" />
          </div>
        )}

        {currentSlide.status === SLIDE_STATUS.ERROR && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-surface/80 p-4">
            <p className="max-w-xs rounded-2xl border border-margin/40 bg-surface px-4 py-2.5 text-center text-sm text-margin shadow-sm">
              {currentSlide.error}
            </p>
          </div>
        )}
      </div>

      <span className="font-mono text-xs tracking-wide text-ink-soft">
        {String(currentSlide.index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </span>

      <div className="flex items-center gap-2">
        {slides.length > 1 && (
          <button
            onClick={goToPrevious}
            disabled={!hasPrevious}
            aria-label="Əvvəlki slayd"
            className="flex items-center justify-center rounded-full border border-ink-soft/30 bg-surface p-2 text-ink transition hover:border-margin hover:text-margin disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft size={17} />
          </button>
        )}

        <button
          onClick={togglePause}
          aria-label={
            returnToSlideIndex != null
              ? `Slayd ${returnToSlideIndex + 1}-ə qayıt`
              : isPaused
                ? "Davam et"
                : "Pauza"
          }
          className="flex items-center gap-1.5 rounded-full border border-ink-soft/30 bg-surface px-4 py-1.5 text-sm text-ink transition hover:border-margin hover:text-margin"
        >
          {returnToSlideIndex != null ? (
            <Undo2 size={15} />
          ) : isPaused ? (
            <Play size={15} />
          ) : (
            <Pause size={15} />
          )}
          {returnToSlideIndex != null
            ? `Slayd ${returnToSlideIndex + 1}-ə qayıt`
            : isPaused
              ? "Davam et"
              : "Pauza"}
        </button>

        {slides.length > 1 && (
          <button
            onClick={goToNext}
            disabled={!hasNext}
            aria-label="Növbəti slayd"
            className="flex items-center justify-center rounded-full border border-ink-soft/30 bg-surface p-2 text-ink transition hover:border-margin hover:text-margin disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight size={17} />
          </button>
        )}
      </div>
    </div>
  );
}
