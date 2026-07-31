import { Type } from "@google/genai";
import { getGeminiClient, TEXT_MODEL, AZERBAIJANI_SYSTEM_PROMPT } from "./client";
import type { NarrationFocusPoint } from "@/types";

interface NarrationResult {
  narrationText: string;
  focusPoints: NarrationFocusPoint[];
}

function locateFocusPoints(narrationText: string, orderedTerms: string[]): NarrationFocusPoint[] {
  const points: NarrationFocusPoint[] = [];
  for (const term of orderedTerms) {
    const index = narrationText.indexOf(term);
    if (index === -1) continue;
    points.push({ term, positionFraction: index / narrationText.length });
  }
  return points.sort((a, b) => a.positionFraction - b.positionFraction);
}

export async function generateNarration(
  imageBase64: string,
  mimeType: string,
  slideIndex: number,
  totalSlides: number
): Promise<NarrationResult> {
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
              "Slaydda göstərilən konkret rəqəmlərə, düsturlara və terminlərə istinad et.\n\n" +
              "Əlavə olaraq, izahatında qeyd etdiyin ən vacib 2-5 konkret termini, rəqəmi və ya " +
              "düsturu, onları izahatda QEYD ETDİYİN SIRA ilə (danışıq ardıcıllığı ilə) siyahı " +
              "şəklində qaytar. Hər termin izahat mətnindəki yazılışı ilə HƏRFİ EYNİ olmalıdır " +
              "(böyük/kiçik hərflərə və boşluqlara qədər) — əks halda uyğunlaşdırılmayacaq.",
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
          narrationText: { type: Type.STRING },
          focusTerms: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["narrationText", "focusTerms"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned no narration text");
  }

  const parsed = JSON.parse(text) as { narrationText: string; focusTerms: string[] };
  return {
    narrationText: parsed.narrationText,
    focusPoints: locateFocusPoints(parsed.narrationText, parsed.focusTerms),
  };
}
