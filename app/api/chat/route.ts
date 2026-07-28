import { NextResponse } from "next/server";
import { answerChatQuestion } from "@/lib/gemini";
import { withRetry } from "@/lib/retry";
import { describeApiError } from "@/lib/describeApiError";
import type { ChatRequest, ChatResponse } from "@/types";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequest;

  try {
    const response: ChatResponse = await withRetry(() =>
      answerChatQuestion({
        questionText: body.questionText,
        currentSlideNarration: body.currentSlide.narrationText,
        deckSummary: body.deckSummary,
      })
    );
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json(
      { error: describeApiError(err, "Suala cavab verərkən xəta baş verdi. Yenidən cəhd edin.") },
      { status: 500 }
    );
  }
}
