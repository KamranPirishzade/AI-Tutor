"use client";

import { useEffect, useRef, useState } from "react";
import { useSlideAudioPlayer } from "./useSlideAudioPlayer";
import { findFocusHighlight, type HighlightBox } from "@/lib/findFocusHighlight";
import type { Slide } from "@/types";

interface FocusChangeInput {
  term: string | null;
  relevantSlideNumber: number | null;
}

export function usePresentationSession(slides: Slide[]) {
  const {
    currentSlide,
    isPaused,
    narrationFocusTerm,
    togglePause,
    pause,
    resume,
    goToPrevious,
    goToNext,
    jumpToSlide,
    hasPrevious,
    hasNext,
  } = useSlideAudioPlayer(slides);

  const [focusTerm, setFocusTerm] = useState<{ term: string; slideIndex: number } | null>(null);
  const chatFocusTerm =
    focusTerm && currentSlide && focusTerm.slideIndex === currentSlide.index ? focusTerm.term : null;
  const activeFocusTerm = chatFocusTerm ?? narrationFocusTerm;
  const highlightBox: HighlightBox | null =
    activeFocusTerm && currentSlide ? findFocusHighlight(currentSlide.textItems, activeFocusTerm) : null;

  const [returnToSlideIndex, setReturnToSlideIndex] = useState<number | null>(null);
  const returnToSlideIndexRef = useRef(returnToSlideIndex);
  useEffect(() => {
    returnToSlideIndexRef.current = returnToSlideIndex;
  }, [returnToSlideIndex]);

  function handleFocusChange({ term, relevantSlideNumber }: FocusChangeInput) {
    if (!currentSlide) {
      setFocusTerm(null);
      return;
    }

    const targetSlide =
      relevantSlideNumber != null ? (slides[relevantSlideNumber - 1] ?? currentSlide) : currentSlide;

    if (targetSlide.index !== currentSlide.index) {
      setReturnToSlideIndex((prev) => prev ?? currentSlide.index);
      jumpToSlide(targetSlide.index);
    }

    if (term && findFocusHighlight(targetSlide.textItems, term)) {
      setFocusTerm({ term, slideIndex: targetSlide.index });
    } else {
      setFocusTerm(null);
    }
  }

  function handleAnswerPlaybackEnd() {
    if (returnToSlideIndexRef.current === null) {
      resume();
    }
  }

  function handleTogglePause() {
    if (returnToSlideIndex !== null && isPaused) {
      jumpToSlide(returnToSlideIndex);
      setReturnToSlideIndex(null);
      resume();
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

  return {
    currentSlide,
    isPaused,
    activeFocusTerm,
    highlightBox,
    returnToSlideIndex,
    hasPrevious,
    hasNext,
    pauseNarration: pause,
    togglePause: handleTogglePause,
    goToPrevious: handleGoToPrevious,
    goToNext: handleGoToNext,
    onFocusChange: handleFocusChange,
    onAnswerPlaybackEnd: handleAnswerPlaybackEnd,
  };
}
