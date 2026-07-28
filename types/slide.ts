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

export interface Slide {
  index: number;
  imageDataUrl: string;
  textItems: SlideTextItem[];
  narrationText?: string;
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
}
