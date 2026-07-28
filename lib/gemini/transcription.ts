import { getGeminiClient, TEXT_MODEL } from "./client";

/**
 * Azerbaijani and Turkish are close, mutually-intelligible Turkic
 * languages — without an explicit hint, speech models tend to drift
 * toward the far more common Turkish and "correct" Azerbaijani spelling
 * into Turkish orthography (e.g. dropping ə, respelling ğ/x/q). This
 * instruction exists specifically to prevent that drift, not to steer
 * output language the way AZERBAIJANI_SYSTEM_PROMPT does for answers.
 */
const AZERBAIJANI_TRANSCRIPTION_INSTRUCTION =
  "Sən Azərbaycan dilinə ixtisaslaşmış nitqi mətnə çevirmə sistemisən. Danışan Azərbaycan " +
  "dilində danışır — Türk dilində deyil. Bunu Türk dilinə və ya başqa bir dilə TƏRCÜMƏ ETMƏ, " +
  "sadəcə eşitdiyini olduğu kimi Azərbaycan orfoqrafiyası ilə yaz (ə, x, q, ğ, ı, İ, ö, ş, ü, ç " +
  "hərflərini doğru istifadə et, Türk dilinin yazılışına uyğunlaşdırma). Yalnız transkripsiya " +
  "mətnini qaytar — şərh, giriş sözü, dırnaq işarəsi əlavə etmə. Audioda başa düşülən nitq " +
  "yoxdursa, boş mətn qaytar, heç nə uydurma.";

/** Transcribes spoken audio to text (no translation, no answering — just a
 * verbatim transcript of what was said). */
export async function transcribeAudio(
  audioBase64: string,
  audioMimeType: string
): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ inlineData: { mimeType: audioMimeType, data: audioBase64 } }],
      },
    ],
    config: {
      systemInstruction: AZERBAIJANI_TRANSCRIPTION_INSTRUCTION,
      // Transcription should be faithful, not creative — greedy decoding
      // reduces hallucination on unclear or quiet audio.
      temperature: 0,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned no transcription");
  }
  return text.trim();
}
