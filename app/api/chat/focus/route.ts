import { NextResponse } from "next/server";
import { extractChatFocusInfo } from "@/lib/gemini";
import { withRetry } from "@/lib/retry";
import { describeApiError } from "@/lib/describeApiError";
import type { ChatFocusRequest, ChatFocusInfo } from "@/types";

export const maxDuration = 30;

/** Small, fast follow-up call made once the streamed answer text (from
 * /api/chat) is fully known — extracts the highlight term and which slide
 * the answer actually concerns. Kept as its own call so it can run in
 * parallel with /api/tts on the client instead of adding to the wait
 * before audio starts. */
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
      { error: describeApiError(err, "Fokus məlumatı alınarkən xəta baş verdi.") },
      { status: 500 }
    );
  }
}
