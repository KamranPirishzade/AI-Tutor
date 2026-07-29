import { streamChatAnswer } from "@/lib/gemini";
import { withRetry } from "@/lib/retry";
import { describeApiError } from "@/lib/describeApiError";
import type { ChatRequest } from "@/types";

export const maxDuration = 30;

/** Streams the answer as plain text chunks instead of one JSON blob, so the
 * chat bubble can grow progressively on the client. Establishing the
 * stream (the call that can actually 429) happens inside withRetry before
 * any bytes go to the client — once that succeeds, the response has
 * already started, so a failure while relaying chunks can only be logged,
 * not retried or reported with a proper status code. */
export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequest;

  let answerStream: AsyncGenerator<string>;
  try {
    answerStream = await withRetry(() =>
      streamChatAnswer({
        questionText: body.questionText,
        currentSlideNarration: body.currentSlide.narrationText,
        deckSummary: body.deckSummary,
      })
    );
  } catch (err) {
    console.error("[/api/chat]", err);
    return Response.json(
      { error: describeApiError(err, "Suala cavab verərkən xəta baş verdi. Yenidən cəhd edin.") },
      { status: 500 }
    );
  }

  const encoder = new TextEncoder();
  const responseBody = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of answerStream) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (err) {
        console.error("[/api/chat] stream interrupted", err);
        controller.error(err);
      }
    },
  });

  return new Response(responseBody, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
