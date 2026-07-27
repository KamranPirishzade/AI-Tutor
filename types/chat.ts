export interface TranscribeRequest {
  audioBase64: string;
  audioMimeType: string;
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

export interface ChatResponse {
  answerText: string;
  focusTerm: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  focusTerm?: string | null;
  audioBase64?: string;
}
