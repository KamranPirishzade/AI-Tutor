"use client";

import { useEffect, useRef, useState } from "react";
import { fadeAudioVolume } from "@/lib/audioFade";
import { toAudioDataUri } from "@/lib/audioDataUri";
import type { Slide, NarrationFocusPoint } from "@/types";

const AUDIO_FADE_MS = 220;

function findActiveFocusPoint(
  focusPoints: NarrationFocusPoint[],
  progress: number
): string | null {
  let active: string | null = null;
  for (const point of focusPoints) {
    if (point.positionFraction > progress) break;
    active = point.term;
  }
  return active;
}

export function useSlideAudioPlayer(slides: Slide[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [narrationFocusTerm, setNarrationFocusTerm] = useState<string | null>(null);

  const currentSlide = slides[currentIndex];
  const audioCacheRef = useRef<Map<number, HTMLAudioElement>>(new Map());

  useEffect(() => {
    if (!currentSlide?.audioBase64) return;

    const cached = audioCacheRef.current.get(currentIndex);
    const audio = cached ?? new Audio(toAudioDataUri(currentSlide.audioBase64));
    if (!cached) audioCacheRef.current.set(currentIndex, audio);
    const focusPoints = currentSlide.focusPoints;

    function handleTimeUpdate() {
      if (focusPoints.length === 0 || !audio.duration) return;
      setNarrationFocusTerm(findActiveFocusPoint(focusPoints, audio.currentTime / audio.duration));
    }
    function handleEnded() {
      audio.currentTime = 0;
      setCurrentIndex((index) => (index + 1 < slides.length ? index + 1 : index));
    }
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    let didPlay = false;
    if (!isPaused) {
      didPlay = true;
      audio.volume = 0;
      audio
        .play()
        .then(() => fadeAudioVolume(audio, 0, 1, AUDIO_FADE_MS))
        .catch(() => {});
    }

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      if (didPlay) {
        fadeAudioVolume(audio, audio.volume, 0, AUDIO_FADE_MS, () => audio.pause());
      }
      setNarrationFocusTerm(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentSlide?.audioBase64, isPaused]);

  function togglePause() {
    setIsPaused((paused) => !paused);
  }

  function goToSlideAndResume(index: number) {
    if (index < 0 || index >= slides.length) return;
    setIsPaused(false);
    setCurrentIndex(index);
  }

  function jumpToSlide(index: number) {
    if (index < 0 || index >= slides.length) return;
    setCurrentIndex(index);
  }

  return {
    currentSlide,
    isPaused,
    narrationFocusTerm,
    togglePause,
    pause: () => setIsPaused(true),
    resume: () => setIsPaused(false),
    goToPrevious: () => goToSlideAndResume(currentIndex - 1),
    goToNext: () => goToSlideAndResume(currentIndex + 1),
    jumpToSlide,
    hasPrevious: currentIndex > 0,
    hasNext: currentIndex + 1 < slides.length,
  };
}
