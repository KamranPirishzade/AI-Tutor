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

export interface TtsRequest {
  text: string;
}

export interface TtsResponse {
  audioBase64: string;
  mimeType: "audio/wav";
}

export interface ChatRequest {
  audioBase64: string;
  audioMimeType: string;
  currentSlide: {
    index: number;
    narrationText: string;
  };
  deckSummary: string;
}

export interface ChatResponse {
  answerText: string;
  focusTerm: string | null;
}

export interface ChatMessage {
  id: string;
  answerText: string;
  focusTerm: string | null;
  audioBase64?: string;
}
