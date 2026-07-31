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
 * verbatim transcript of what was said). An optional contextText (the
 * current slide's narration / deck summary) is included purely as a
 * vocabulary hint: lecture-specific terms and proper nouns transcribe far
 * more reliably once the model has already seen them written out, instead
 * of guessing at unfamiliar words from audio alone. */
export async function transcribeAudio(
  audioBase64: string,
  audioMimeType: string,
  contextText?: string
): Promise<string> {
  const ai = getGeminiClient();
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  if (contextText) {
    parts.push({
      text:
        "Kontekst (yalnız termin və adları düzgün tanımaq üçün istinad et, tərcümə etmə, " +
        `şərh vermə): ${contextText}`,
    });
  }
  parts.push({ inlineData: { mimeType: audioMimeType, data: audioBase64 } });

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [
      {
        role: "user",
        parts,
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
