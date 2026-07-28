"use client";

import { useMemo, useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { PresentationViewer } from "@/components/PresentationViewer";
import { ChatPanel } from "@/components/ChatPanel";
import { MarginRule } from "@/components/MarginRule";
import { useIngestSlides } from "@/hooks/useIngestSlides";
import { useSlideAudioPlayer } from "@/hooks/useSlideAudioPlayer";
import type { RenderedSlide } from "@/lib/pdfRender";

const SUMMARY_CHARS_PER_SLIDE = 200;

export default function Home() {
  const [deckId, setDeckId] = useState<string | null>(null);
  const [rawSlides, setRawSlides] = useState<RenderedSlide[]>([]);

  const { slides, readyCount, totalCount } = useIngestSlides(deckId, rawSlides);
  const {
    currentSlide,
    isPaused,
    togglePause,
    pause: pauseNarration,
    resume: resumeNarration,
    goToPrevious,
    goToNext,
    hasPrevious,
    hasNext,
  } = useSlideAudioPlayer(slides);

  const deckSummary = useMemo(
    () =>
      slides
        .filter((s) => s.narrationText)
        .map((s) => `Slayd ${s.index + 1}: ${s.narrationText!.slice(0, SUMMARY_CHARS_PER_SLIDE)}`)
        .join("\n"),
    [slides]
  );

  if (!deckId) {
    return (
      <UploadZone
        onReady={(id, newSlides) => {
          setDeckId(id);
          setRawSlides(newSlides);
        }}
      />
    );
  }

  return (
    <main className="grid-paper flex min-h-0 flex-1">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-start gap-4 overflow-y-auto p-8">
        <p className="font-mono text-xs tracking-wide text-ink-soft">
          {readyCount}/{totalCount} slayd hazır
        </p>
        <PresentationViewer
          slides={slides}
          currentSlide={currentSlide}
          isPaused={isPaused}
          togglePause={togglePause}
          goToPrevious={goToPrevious}
          goToNext={goToNext}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
        />
      </div>
      <MarginRule />
      <ChatPanel
        currentSlideIndex={currentSlide?.index ?? 0}
        currentSlideNarration={currentSlide?.narrationText ?? ""}
        deckSummary={deckSummary}
        onQuestionSent={pauseNarration}
        onAnswerPlaybackEnd={resumeNarration}
      />
    </main>
  );
}
