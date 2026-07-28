/** One run of text extracted from the source PDF, positioned as 0-1
 * fractions of the slide image's width/height (resolution-independent, so
 * it stays correct at any display size). */
export interface SlideTextItem {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

/** A term the narration discusses, with its approximate position through
 * the narration text (0 = start, 1 = end) — NOT synced to actual audio
 * timing (Gemini TTS gives no word-level timestamps), just an estimate
 * based on where the term falls in the narration script. Used to switch
 * the on-slide highlight roughly along with playback. */
export interface NarrationFocusPoint {
  term: string;
  positionFraction: number;
}

export interface Slide {
  index: number;
  imageDataUrl: string;
  textItems: SlideTextItem[];
  narrationText?: string;
  focusPoints: NarrationFocusPoint[];
  audioBase64?: string;
  status: "pending" | "narrating" | "synthesizing" | "ready" | "error";
  error?: string;
}

export interface IngestRequest {
  imageBase64: string;
  mimeType: "image/jpeg" | "image/png";
  slideIndex: number;
  totalSlides: number;
}

export interface IngestResponse {
  narrationText: string;
  focusPoints: NarrationFocusPoint[];
}
