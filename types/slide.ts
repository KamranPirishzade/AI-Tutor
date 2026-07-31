import type { SlideStatus, SLIDE_IMAGE_MIME_TYPE } from "@/lib/constants";

export interface SlideTextItem {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

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
  status: SlideStatus;
  error?: string;
}

export interface IngestRequest {
  imageBase64: string;
  mimeType: typeof SLIDE_IMAGE_MIME_TYPE;
  slideIndex: number;
  totalSlides: number;
}

export interface IngestResponse {
  narrationText: string;
  focusPoints: NarrationFocusPoint[];
}
