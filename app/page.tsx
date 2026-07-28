"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { PresentationViewer } from "@/components/PresentationViewer";
import { ChatPanel } from "@/components/ChatPanel";
import { MarginRule } from "@/components/MarginRule";
import { useIngestSlides } from "@/hooks/useIngestSlides";
import { useSlideAudioPlayer } from "@/hooks/useSlideAudioPlayer";
import { findFocusHighlight } from "@/lib/findFocusHighlight";
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
    jumpToSlide,
    hasPrevious,
    hasNext,
  } = useSlideAudioPlayer(slides);

  // A highlight belongs to the slide it was found on — recording which
  // slide alongside the term means it naturally stops applying once the
  // view moves to a different slide, with no separate "clear on change"
  // effect needed.
  const [focusTerm, setFocusTerm] = useState<{ term: string; slideIndex: number } | null>(null);
  const activeFocusTerm =
    focusTerm && currentSlide && focusTerm.slideIndex === currentSlide.index
      ? focusTerm.term
      : null;

  // Set when a chat answer's focus term lives on a different slide than the
  // one being viewed and we jump there automatically — records where to
  // snap back to once the user asks to continue. Cleared by returning, or
  // by the user taking manual control of navigation themselves.
  const [returnToSlideIndex, setReturnToSlideIndex] = useState<number | null>(null);

  // handleAnswerPlaybackEnd is captured inside useChatThread's handleSend
  // closure at the moment a question is sent — well before the cross-slide
  // jump (a few lines below, in handleFocusTermChange) has happened. By the
  // time the answer's audio actually finishes and calls it back, that
  // captured closure's own `returnToSlideIndex` is stale (still null). A
  // ref sidesteps that: it's the same mutable box regardless of which
  // render's closure reads it, so `.current` is always up to date.
  const returnToSlideIndexRef = useRef(returnToSlideIndex);
  useEffect(() => {
    returnToSlideIndexRef.current = returnToSlideIndex;
  }, [returnToSlideIndex]);

  const deckSummary = useMemo(
    () =>
      slides
        .filter((s) => s.narrationText)
        .map((s) => `Slayd ${s.index + 1}: ${s.narrationText!.slice(0, SUMMARY_CHARS_PER_SLIDE)}`)
        .join("\n"),
    [slides]
  );

  function handleFocusTermChange(term: string | null) {
    if (!term || !currentSlide) {
      setFocusTerm(null);
      return;
    }

    // Check the current slide first, then every other slide in order.
    const searchOrder = [currentSlide, ...slides.filter((s) => s.index !== currentSlide.index)];
    const matchedSlide = searchOrder.find((s) => findFocusHighlight(s.textItems, term) !== null);

    if (!matchedSlide) {
      setFocusTerm(null);
      return;
    }

    if (matchedSlide.index !== currentSlide.index) {
      // Remember the very first spot we were displaced from, not
      // wherever we happened to be after a previous jump.
      setReturnToSlideIndex((prev) => prev ?? currentSlide.index);
      jumpToSlide(matchedSlide.index);
    }

    setFocusTerm({ term, slideIndex: matchedSlide.index });
  }

  function handleAnswerPlaybackEnd() {
    // Stay paused on the jumped-to slide until the user asks to continue —
    // only auto-resume here when we never left the original slide.
    if (returnToSlideIndexRef.current === null) {
      resumeNarration();
    }
  }

  function handleTogglePause() {
    if (returnToSlideIndex !== null && isPaused) {
      jumpToSlide(returnToSlideIndex);
      setReturnToSlideIndex(null);
      resumeNarration();
      return;
    }
    togglePause();
  }

  function handleGoToPrevious() {
    setReturnToSlideIndex(null);
    goToPrevious();
  }

  function handleGoToNext() {
    setReturnToSlideIndex(null);
    goToNext();
  }

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
          togglePause={handleTogglePause}
          goToPrevious={handleGoToPrevious}
          goToNext={handleGoToNext}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          activeFocusTerm={activeFocusTerm}
          returnToSlideIndex={returnToSlideIndex}
        />
      </div>
      <MarginRule />
      <ChatPanel
        currentSlideIndex={currentSlide?.index ?? 0}
        currentSlideNarration={currentSlide?.narrationText ?? ""}
        deckSummary={deckSummary}
        onQuestionSent={pauseNarration}
        onAnswerPlaybackEnd={handleAnswerPlaybackEnd}
        onFocusTermChange={handleFocusTermChange}
      />
    </main>
  );
}
