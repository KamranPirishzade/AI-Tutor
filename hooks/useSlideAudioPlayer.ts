"use client";

import { useEffect, useState } from "react";
import { fadeAudioVolume } from "@/lib/audioFade";
import type { Slide, NarrationFocusPoint } from "@/types";

const AUDIO_FADE_MS = 220;

/** The last focus point whose position we've already reached in playback —
 * an approximation of "what's being discussed right now", since Gemini TTS
 * gives no real word-level timestamps to sync against. */
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

/** Plays each slide's narration audio in order, auto-advancing to the next
 * slide when playback ends. Also supports jumping to an arbitrary slide
 * (manual next/previous) — the outgoing slide's audio fades out while the
 * incoming one fades in, so a manual switch feels soft rather than an
 * abrupt cut. Exposes pause/resume so a caller outside this hook (e.g. the
 * chat feature, when the user asks a question) can silence the narration
 * without it fighting for playback with something else. Also tracks which
 * of the slide's focus points playback has reached, so the on-slide
 * highlight can move roughly along with the narration. */
export function useSlideAudioPlayer(slides: Slide[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [narrationFocusTerm, setNarrationFocusTerm] = useState<string | null>(null);

  const currentSlide = slides[currentIndex];

  useEffect(() => {
    if (!currentSlide?.audioBase64 || isPaused) return;

    const audio = new Audio(`data:audio/wav;base64,${currentSlide.audioBase64}`);
    audio.volume = 0;
    const focusPoints = currentSlide.focusPoints;

    function handleTimeUpdate() {
      if (focusPoints.length === 0 || !audio.duration) return;
      setNarrationFocusTerm(findActiveFocusPoint(focusPoints, audio.currentTime / audio.duration));
    }
    audio.addEventListener("timeupdate", handleTimeUpdate);

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
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.onended = null;
      fadeAudioVolume(audio, audio.volume, 0, AUDIO_FADE_MS, () => audio.pause());
      setNarrationFocusTerm(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide?.audioBase64, isPaused]);

  function togglePause() {
    setIsPaused((paused) => !paused);
  }

  function goToSlideAndResume(index: number) {
    if (index < 0 || index >= slides.length) return;
    setIsPaused(false);
    setCurrentIndex(index);
  }

  /** Changes the visible slide without touching the paused state — used
   * when jumping to a different slide for a cross-reference during a chat
   * answer, where narration must stay silent regardless. */
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
