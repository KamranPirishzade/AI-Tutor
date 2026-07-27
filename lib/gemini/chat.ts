import { Type } from "@google/genai";
import { getGeminiClient, TEXT_MODEL, AZERBAIJANI_SYSTEM_PROMPT } from "./client";
import type { ChatResponse } from "@/types";

/** Answers a text question about the presentation, given the current slide's
 * narration and a summary of the whole deck for cross-slide context. Asks
 * Gemini for structured JSON so the answer and its focus term (the specific
 * word/number/formula to highlight in the UI) arrive as separate fields. */
export async function answerChatQuestion(params: {
  questionText: string;
  currentSlideNarration: string;
  deckSummary: string;
}): Promise<ChatResponse> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              `İstifadəçinin sualı: ${params.questionText}\n\n` +
              `Hazırkı slaydın izahı: ${params.currentSlideNarration}\n\n` +
              `Bütün təqdimatın xülasəsi: ${params.deckSummary}\n\n` +
              "Yuxarıdakı suala cavab ver. " +
              "Cavabında konkret bir termin, rəqəm və ya düstura istinad edirsənsə, " +
              "onu focusTerm sahəsində dəqiq olaraq (cavab mətnindəki yazılışı ilə eyni) qeyd et. " +
              "Əgər konkret bir elementə istinad yoxdursa, focusTerm-i null et.",
          },
        ],
      },
    ],
    config: {
      systemInstruction: AZERBAIJANI_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answerText: { type: Type.STRING },
          focusTerm: { type: Type.STRING, nullable: true },
        },
        required: ["answerText", "focusTerm"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned no chat answer");
  }
  return JSON.parse(text) as ChatResponse;
}
