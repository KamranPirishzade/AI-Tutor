"use client";

import { useEffect, useRef, useState } from "react";
import type { Slide } from "@/types";

/** Plays each slide's narration audio in order, auto-advancing to the next
 * slide when playback ends. Reports the current index up to the caller (via
 * onIndexChange) so other parts of the UI, like the chat panel, can know
 * which slide is currently showing. */
export function useSlideAudioPlayer(slides: Slide[], onIndexChange?: (index: number) => void) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSlide = slides[currentIndex];

  useEffect(() => {
    onIndexChange?.(currentIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    if (!currentSlide?.audioBase64 || isPaused) return;

    const audio = new Audio(`data:audio/wav;base64,${currentSlide.audioBase64}`);
    audioRef.current = audio;
    audio.onended = () => {
      setCurrentIndex((index) => (index + 1 < slides.length ? index + 1 : index));
    };
    audio.play().catch(() => {
      // Autoplay can be blocked before any user gesture on the page — the
      // pause/resume button doubles as a manual retry in that case.
    });

    return () => {
      audio.pause();
      audio.onended = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide?.audioBase64, isPaused]);

  function togglePause() {
    setIsPaused((paused) => !paused);
  }

  return { currentSlide, isPaused, togglePause };
}
