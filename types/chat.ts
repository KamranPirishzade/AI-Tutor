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

export interface ChatFocusRequest {
  questionText: string;
  answerText: string;
  currentSlideNarration: string;
  deckSummary: string;
}

export interface ChatFocusInfo {
  focusTerm: string | null;
  /** 1-indexed slide number (matching the "Slayd N" labels in the deck
   * summary) the answer is actually about, or null if it's just about the
   * current slide / nothing specific. Lets the UI navigate to the right
   * slide even when the source PDF has no extractable text to match
   * against (e.g. the content is conveyed by an image). */
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
