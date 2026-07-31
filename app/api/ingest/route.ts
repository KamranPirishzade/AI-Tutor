import { NextResponse } from "next/server";
import { generateNarration } from "@/lib/gemini";
import { withRetry } from "@/lib/retry";
import { describeApiError } from "@/lib/describeApiError";
import { MESSAGES } from "@/lib/messages";
import type { IngestRequest, IngestResponse } from "@/types";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body = (await request.json()) as IngestRequest;

  try {
    const { narrationText, focusPoints } = await withRetry(() =>
      generateNarration(body.imageBase64, body.mimeType, body.slideIndex, body.totalSlides)
    );
    const response: IngestResponse = { narrationText, focusPoints };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/ingest]", err);
    return NextResponse.json(
      { error: describeApiError(err, MESSAGES.api.ingestFallback) },
      { status: 500 }
    );
  }
}
