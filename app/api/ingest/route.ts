import { NextResponse } from "next/server";
import { generateNarration } from "@/lib/gemini";
import { withRetry } from "@/lib/concurrency";
import type { IngestRequest, IngestResponse } from "@/types";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body = (await request.json()) as IngestRequest;

  try {
    const narrationText = await withRetry(() =>
      generateNarration(body.imageBase64, body.mimeType, body.slideIndex, body.totalSlides)
    );
    const response: IngestResponse = { narrationText };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/ingest]", err);
    return NextResponse.json(
      { error: "Slaydı izah edərkən xəta baş verdi. Yenidən cəhd edin." },
      { status: 500 }
    );
  }
}
