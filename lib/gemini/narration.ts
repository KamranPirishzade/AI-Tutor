import { getGeminiClient, TEXT_MODEL, AZERBAIJANI_SYSTEM_PROMPT } from "./client";

/** Sends one slide image to Gemini's vision input and asks for a short
 * spoken-style Azerbaijani explanation of it. */
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
              `Bu, ${totalSlides} slayddan ibarət bir təqdimatın ${slideIndex + 1}-ci slaydıdır. ` +
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
