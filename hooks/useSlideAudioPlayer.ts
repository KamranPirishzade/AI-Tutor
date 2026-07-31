"use client";

import { useEffect, useRef, useState } from "react";
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
 * highlight can move roughly along with the narration.
 *
 * Each slide keeps its own Audio element for the lifetime of the deck
 * (see audioCacheRef) instead of a fresh one being created every time this
 * slide becomes current — that's what lets pausing (manually, or being
 * displaced by a chat question that jumps to a different slide and back)
 * resume from the exact spot instead of restarting. A slide that has
 * already played to the end resets its own position back to 0 the moment
 * it ends (see handleEnded), so revisiting a *finished* slide still starts
 * over, same as before — only an interrupted slide remembers its place.
 *
 * The cache is keyed by slide index only, not by deck — fine today since
 * nothing in the UI lets a new deck replace an already-loaded one without
 * a full page reload (which remounts this hook from scratch anyway). */
export function useSlideAudioPlayer(slides: Slide[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [narrationFocusTerm, setNarrationFocusTerm] = useState<string | null>(null);

  const currentSlide = slides[currentIndex];
  const audioCacheRef = useRef<Map<number, HTMLAudioElement>>(new Map());

  useEffect(() => {
    if (!currentSlide?.audioBase64) return;

    const cached = audioCacheRef.current.get(currentIndex);
    const audio = cached ?? new Audio(`data:audio/wav;base64,${currentSlide.audioBase64}`);
    if (!cached) audioCacheRef.current.set(currentIndex, audio);
    const focusPoints = currentSlide.focusPoints;

    function handleTimeUpdate() {
      if (focusPoints.length === 0 || !audio.duration) return;
      setNarrationFocusTerm(findActiveFocusPoint(focusPoints, audio.currentTime / audio.duration));
    }
    function handleEnded() {
      // Reset now so a *later* revisit of this same (finished) slide starts
      // from the beginning — only an interrupted slide should resume mid-way.
      audio.currentTime = 0;
      setCurrentIndex((index) => (index + 1 < slides.length ? index + 1 : index));
    }
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    // Tracks whether *this* effect run actually started playback — the
    // cleanup below must only fade-out-then-pause if it did. Otherwise a
    // run where isPaused was already true (audio never played here) would
    // still queue a fade+pause on cleanup, which — since fades run on a
    // delay — fires shortly *after* a following resume's play() and
    // silently pauses it again a moment later.
    let didPlay = false;
    if (!isPaused) {
      didPlay = true;
      audio.volume = 0;
      audio
        .play()
        .then(() => fadeAudioVolume(audio, 0, 1, AUDIO_FADE_MS))
        .catch(() => {
          // Autoplay can be blocked before any user gesture on the page — the
          // pause/resume button doubles as a manual retry in that case.
        });
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
