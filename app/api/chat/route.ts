import { NextResponse } from "next/server";
import { answerChatQuestion } from "@/lib/gemini";
import { withRetry } from "@/lib/concurrency";
import type { ChatRequest, ChatResponse } from "@/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequest;

  try {
    const response: ChatResponse = await withRetry(() =>
      answerChatQuestion({
        audioBase64: body.audioBase64,
        audioMimeType: body.audioMimeType,
        currentSlideNarration: body.currentSlide.narrationText,
        deckSummary: body.deckSummary,
      })
    );
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json(
      { error: "Suala cavab verərkən xəta baş verdi. Yenidən cəhd edin." },
      { status: 500 }
    );
  }
}
