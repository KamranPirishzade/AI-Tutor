import { NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/gemini";
import { pcmToWav } from "@/lib/wav";
import { withRetry } from "@/lib/retry";
import type { TtsRequest, TtsResponse } from "@/types";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body = (await request.json()) as TtsRequest;

  try {
    const { base64, mimeType } = await withRetry(() => synthesizeSpeech(body.text));
    const response: TtsResponse = {
      audioBase64: pcmToWav(base64, mimeType),
      mimeType: "audio/wav",
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/tts]", err);
    return NextResponse.json(
      { error: "Səsləndirmə zamanı xəta baş verdi. Yenidən cəhd edin." },
      { status: 500 }
    );
  }
}
