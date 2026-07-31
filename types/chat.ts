export interface TranscribeRequest {
  audioBase64: string;
  audioMimeType: string;
  contextText?: string;
}

export interface TranscribeResponse {
  text: string;
}

export interface ChatRequest {
  questionText: string;
  currentSlide: {
    index: number;
    narrationText: string;
  };
  deckSummary: string;
}

export interface ChatFocusRequest {
  questionText: string;
  answerText: string;
  currentSlideNarration: string;
  deckSummary: string;
}

export interface ChatFocusInfo {
  focusTerm: string | null;
  relevantSlideNumber: number | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  focusTerm?: string | null;
  relevantSlideNumber?: number | null;
  audioBase64?: string;
}
