"use client";

import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { PresentationViewer } from "@/components/PresentationViewer";
import { ChatPanel } from "@/components/ChatPanel";
import { MarginRule } from "@/components/MarginRule";
import { useIngestSlides } from "@/hooks/useIngestSlides";
import { usePresentationSession } from "@/hooks/usePresentationSession";
import { buildDeckSummary } from "@/lib/deckSummary";
import type { RenderedSlide } from "@/lib/pdfRender";

export default function Home() {
  const [deckId, setDeckId] = useState<string | null>(null);
  const [rawSlides, setRawSlides] = useState<RenderedSlide[]>([]);

  const { slides, readyCount, totalCount } = useIngestSlides(deckId, rawSlides);
  const {
    currentSlide,
    isPaused,
    activeFocusTerm,
    highlightBox,
    returnToSlideIndex,
    hasPrevious,
    hasNext,
    pauseNarration,
    togglePause,
    goToPrevious,
    goToNext,
    onFocusChange,
  } = usePresentationSession(slides);

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
          activeFocusTerm={activeFocusTerm}
          highlightBox={highlightBox}
          returnToSlideIndex={returnToSlideIndex}
        />
      </div>
      <MarginRule />
      <ChatPanel
        currentSlideIndex={currentSlide?.index ?? 0}
        currentSlideNarration={currentSlide?.narrationText ?? ""}
        deckSummary={buildDeckSummary(slides)}
        onQuestionSent={pauseNarration}
        onFocusChange={onFocusChange}
      />
    </main>
  );
}
