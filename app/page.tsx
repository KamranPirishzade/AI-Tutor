"use client";

import { useMemo, useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { PresentationViewer } from "@/components/PresentationViewer";
import { ChatPanel } from "@/components/ChatPanel";
import { useIngestSlides } from "@/hooks/useIngestSlides";
import type { RenderedSlide } from "@/lib/pdfRender";

const SUMMARY_CHARS_PER_SLIDE = 200;

export default function Home() {
  const [deckId, setDeckId] = useState<string | null>(null);
  const [rawSlides, setRawSlides] = useState<RenderedSlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const { slides, readyCount, totalCount } = useIngestSlides(deckId, rawSlides);

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

  const currentSlide = slides[currentSlideIndex];

  return (
    <main className="flex min-h-0 flex-1">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-start gap-4 overflow-y-auto p-8">
        <p className="text-sm text-neutral-500">
          {readyCount}/{totalCount} slayd hazır
        </p>
        <PresentationViewer slides={slides} onIndexChange={setCurrentSlideIndex} />
      </div>
      <ChatPanel
        currentSlideIndex={currentSlideIndex}
        currentSlideNarration={currentSlide?.narrationText ?? ""}
        deckSummary={deckSummary}
      />
    </main>
  );
}
