export interface Slide {
  index: number;
  imageDataUrl: string;
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
