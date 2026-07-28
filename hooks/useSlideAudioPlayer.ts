"use client";

import { useEffect, useState } from "react";
import { fadeAudioVolume } from "@/lib/audioFade";
import type { Slide } from "@/types";

const AUDIO_FADE_MS = 220;

/** Plays each slide's narration audio in order, auto-advancing to the next
 * slide when playback ends. Also supports jumping to an arbitrary slide
 * (manual next/previous) — the outgoing slide's audio fades out while the
 * incoming one fades in, so a manual switch feels soft rather than an
 * abrupt cut. Exposes pause/resume so a caller outside this hook (e.g. the
 * chat feature, when the user asks a question) can silence the narration
 * without it fighting for playback with something else. */
export function useSlideAudioPlayer(slides: Slide[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentSlide = slides[currentIndex];

  useEffect(() => {
    if (!currentSlide?.audioBase64 || isPaused) return;

    const audio = new Audio(`data:audio/wav;base64,${currentSlide.audioBase64}`);
    audio.volume = 0;
    audio.onended = () => {
      setCurrentIndex((index) => (index + 1 < slides.length ? index + 1 : index));
    };
    audio
      .play()
      .then(() => fadeAudioVolume(audio, 0, 1, AUDIO_FADE_MS))
      .catch(() => {
        // Autoplay can be blocked before any user gesture on the page — the
        // pause/resume button doubles as a manual retry in that case.
      });

    return () => {
      audio.onended = null;
      fadeAudioVolume(audio, audio.volume, 0, AUDIO_FADE_MS, () => audio.pause());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide?.audioBase64, isPaused]);

  function togglePause() {
    setIsPaused((paused) => !paused);
  }

  function goToSlide(index: number) {
    if (index < 0 || index >= slides.length) return;
    setIsPaused(false);
    setCurrentIndex(index);
  }

  return {
    currentSlide,
    isPaused,
    togglePause,
    pause: () => setIsPaused(true),
    resume: () => setIsPaused(false),
    goToPrevious: () => goToSlide(currentIndex - 1),
    goToNext: () => goToSlide(currentIndex + 1),
    hasPrevious: currentIndex > 0,
    hasNext: currentIndex + 1 < slides.length,
  };
}
