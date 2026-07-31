import { GoogleGenAI } from "@google/genai";

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
