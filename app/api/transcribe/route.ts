import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/gemini";
import { withRetry } from "@/lib/retry";
import { describeApiError } from "@/lib/describeApiError";
import { MESSAGES } from "@/lib/messages";
import type { TranscribeRequest, TranscribeResponse } from "@/types";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body = (await request.json()) as TranscribeRequest;

  try {
    const text = await withRetry(() =>
      transcribeAudio(body.audioBase64, body.audioMimeType, body.contextText)
    );
    const response: TranscribeResponse = { text };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/transcribe]", err);
    return NextResponse.json(
      { error: describeApiError(err, MESSAGES.api.transcribeFallback) },
      { status: 500 }
    );
  }
}
