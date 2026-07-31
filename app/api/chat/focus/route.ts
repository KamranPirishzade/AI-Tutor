import { NextResponse } from "next/server";
import { extractChatFocusInfo } from "@/lib/gemini";
import { withRetry } from "@/lib/retry";
import { describeApiError } from "@/lib/describeApiError";
import { MESSAGES } from "@/lib/messages";
import type { ChatFocusRequest, ChatFocusInfo } from "@/types";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body = (await request.json()) as ChatFocusRequest;

  try {
    const response: ChatFocusInfo = await withRetry(() =>
      extractChatFocusInfo({
        questionText: body.questionText,
        answerText: body.answerText,
        currentSlideNarration: body.currentSlideNarration,
        deckSummary: body.deckSummary,
      })
    );
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/chat/focus]", err);
    return NextResponse.json(
      { error: describeApiError(err, MESSAGES.api.focusFallback) },
      { status: 500 }
    );
  }
}
