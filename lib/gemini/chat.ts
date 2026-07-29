import { Type } from "@google/genai";
import { getGeminiClient, TEXT_MODEL, AZERBAIJANI_SYSTEM_PROMPT } from "./client";
import type { ChatFocusInfo } from "@/types";

/** Streams the answer to a question about the presentation as plain text
 * chunks (no responseSchema) — letting the chat bubble grow progressively
 * instead of sitting blank until the whole answer is ready. Streaming
 * structured JSON is possible but only delivers partial fragments, which
 * would need an incremental parser for no real benefit here; the two
 * pieces of structured info this used to return alongside the answer
 * (focusTerm, relevantSlideNumber) are now fetched afterwards, once the
 * full text is known, by extractChatFocusInfo below.
 *
 * Returns a Promise (not an async generator directly) so the call that can
 * actually fail — establishing the stream — happens and can throw before
 * any chunk is consumed, letting withRetry catch a 429 here the same way
 * it does for a plain call. If this were an async generator function
 * itself, nothing inside it would run until the caller's first `.next()`,
 * which happens only once the HTTP response has already started streaming
 * — too late to retry. */
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

/** Given a question and its now-fully-known answer, asks for the two
 * structured fields the UI needs to drive highlighting/navigation: the
 * exact term to highlight, and which slide the answer is actually about.
 * Runs after streamChatAnswer's stream completes, in parallel with the TTS
 * call — since TTS only ever needed the full text anyway, this adds no
 * delay to when the audio starts. */
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
