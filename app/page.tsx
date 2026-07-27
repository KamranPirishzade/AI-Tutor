"use client";

import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { PresentationViewer } from "@/components/PresentationViewer";
import { useIngestSlides } from "@/hooks/useIngestSlides";
import type { RenderedSlide } from "@/lib/pdfRender";

export default function Home() {
  const [deckId, setDeckId] = useState<string | null>(null);
  const [rawSlides, setRawSlides] = useState<RenderedSlide[]>([]);

  const { slides, readyCount, totalCount } = useIngestSlides(deckId, rawSlides);

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
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <p className="text-sm text-neutral-500">
        {readyCount}/{totalCount} slayd hazır
      </p>
      <PresentationViewer slides={slides} />
    </main>
  );
}
