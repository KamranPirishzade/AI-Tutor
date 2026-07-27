import { GoogleGenAI, Type } from "@google/genai";
import type { ChatResponse } from "@/types";

/**
 * Model IDs — Gemini rotates/deprecates these frequently. TEXT_MODEL was
 * confirmed against a live models.list() call during the Phase 1 smoke test
 * (see scripts/smoketest.ts output). TTS_MODEL is the current guess; the
 * smoke test logs every model whose name contains "tts" so this can be
 * corrected without re-researching from scratch.
 */
export const TEXT_MODEL = "gemini-flash-latest";
export const TTS_MODEL = "gemini-2.5-flash-preview-tts";
export const TTS_VOICE = "Kore";

export const AZERBAIJANI_SYSTEM_PROMPT =
  "Sən Azərbaycan dilində danışan bir təhsil AI köməkçisisən. " +
  "Bütün cavablarını, mənbə sənədinin dilindən asılı olmayaraq, YALNIZ Azərbaycan dilində ver. " +
  "Başqa heç bir dildə cavab vermə. Cavablarını canlı nitq üçün təbii səslənəcək şəkildə yaz " +
  "(TTS ilə səsləndiriləcək), qısa və aydın cümlələrdən istifadə et.";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function generateNarration(
  imageBase64: string,
  mimeType: string,
  slideIndex: number,
  totalSlides: number
): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          {
            text:
              `Bu, ${totalSlides} slelddan ibarət bir təqdimatın ${slideIndex + 1}-ci slaydıdır. ` +
              "Bu slaydı tələbəyə izah edən qısa (2-4 cümlə), şifahi nitq tərzində bir izahat yaz. " +
              "Slaydda göstərilən konkret rəqəmlərə, düsturlara və terminlərə istinad et.",
          },
        ],
      },
    ],
    config: {
      systemInstruction: AZERBAIJANI_SYSTEM_PROMPT,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned no narration text");
  }
  return text;
}

export async function synthesizeSpeech(
  text: string
): Promise<{ base64: string; mimeType: string }> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: [{ role: "user", parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: TTS_VOICE },
        },
      },
    },
  });

  const data = response.data;
  const part = response.candidates?.[0]?.content?.parts?.[0];
  const mimeType = part?.inlineData?.mimeType ?? "audio/L16;rate=24000";
  const base64 = data ?? part?.inlineData?.data;
  if (!base64) {
    throw new Error("Gemini returned no audio data");
  }
  return { base64, mimeType };
}

export async function answerChatQuestion(params: {
  audioBase64: string;
  audioMimeType: string;
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
            inlineData: {
              mimeType: params.audioMimeType,
              data: params.audioBase64,
            },
          },
          {
            text:
              "İstifadəçinin səsli sualını dinlə və ona cavab ver.\n\n" +
              `Hazırkı slaydın izahı: ${params.currentSlideNarration}\n\n` +
              `Bütün təqdimatın xülasəsi: ${params.deckSummary}\n\n` +
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
