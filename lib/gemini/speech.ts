import { getGeminiClient, TTS_MODEL, TTS_VOICE } from "./client";

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

  const part = response.candidates?.[0]?.content?.parts?.[0];
  const mimeType = part?.inlineData?.mimeType ?? "audio/L16;rate=24000";
  const base64 = response.data ?? part?.inlineData?.data;
  if (!base64) {
    throw new Error("Gemini returned no audio data");
  }
  return { base64, mimeType };
}
