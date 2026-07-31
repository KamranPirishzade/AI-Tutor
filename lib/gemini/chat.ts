import { Type } from "@google/genai";
import { getGeminiClient, TEXT_MODEL, AZERBAIJANI_SYSTEM_PROMPT } from "./client";
import type { ChatFocusInfo } from "@/types";

export async function streamChatAnswer(params: {
  questionText: string;
  currentSlideNarration: string;
  deckSummary: string;
}): Promise<AsyncGenerator<string>> {
  const ai = getGeminiClient();
  const stream = await ai.models.generateContentStream({
    model: TEXT_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              `İstifadəçinin sualı: ${params.questionText}\n\n` +
              `Hazırkı slaydın izahı: ${params.currentSlideNarration}\n\n` +
              `Bütün təqdimatın xülasəsi (hər sətir "Slayd N: ..." formatındadır):\n${params.deckSummary}\n\n` +
              "Yuxarıdakı suala cavab ver.",
          },
        ],
      },
    ],
    config: {
      systemInstruction: AZERBAIJANI_SYSTEM_PROMPT,
    },
  });

  return (async function* () {
    for await (const chunk of stream) {
      if (chunk.text) yield chunk.text;
    }
  })();
}

export async function extractChatFocusInfo(params: {
  questionText: string;
  answerText: string;
  currentSlideNarration: string;
  deckSummary: string;
}): Promise<ChatFocusInfo> {
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
              `Verilmiş cavab: ${params.answerText}\n\n` +
              `Hazırkı slaydın izahı: ${params.currentSlideNarration}\n\n` +
              `Bütün təqdimatın xülasəsi (hər sətir "Slayd N: ..." formatındadır):\n${params.deckSummary}\n\n` +
              "Cavabda konkret bir termin, rəqəm və ya düstura istinad edilirsə, " +
              "onu focusTerm sahəsində dəqiq olaraq (cavab mətnindəki yazılışı ilə eyni) qeyd et. " +
              "Əgər konkret bir elementə istinad yoxdursa, focusTerm-i null et.\n\n" +
              "Əlavə olaraq, cavabın həqiqətən aid olduğu HAZIRKI SLAYDDAN FƏRQLİ bir slayd " +
              "varsa (yuxarıdakı xülasədə həmin slaydın nömrəsini tap), onun nömrəsini " +
              "relevantSlideNumber sahəsində qeyd et (məs. xülasədə \"Slayd 3\" yazılıbsa, 3 qaytar). " +
              "Cavab hazırkı slaydla bağlıdırsa və ya heç bir konkret slaydla bağlı deyilsə, " +
              "relevantSlideNumber-i null et.",
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
          focusTerm: { type: Type.STRING, nullable: true },
          relevantSlideNumber: { type: Type.INTEGER, nullable: true },
        },
        required: ["focusTerm", "relevantSlideNumber"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned no focus info");
  }
  return JSON.parse(text) as ChatFocusInfo;
}
