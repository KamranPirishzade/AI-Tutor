export interface TtsRequest {
  text: string;
}

export interface TtsResponse {
  audioBase64: string;
  mimeType: "audio/wav";
}
