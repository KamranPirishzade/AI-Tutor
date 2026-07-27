import { getGeminiClient, TEXT_MODEL } from "./client";

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
        parts: [
          { inlineData: { mimeType: audioMimeType, data: audioBase64 } },
          {
            text:
              "Bu audioda deyilənləri sözbəsöz mətnə çevir. " +
              "Yalnız transkripsiya mətnini qaytar, əlavə şərh, giriş sözü və ya dırnaq işarəsi əlavə etmə.",
          },
        ],
      },
    ],
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned no transcription");
  }
  return text.trim();
}
