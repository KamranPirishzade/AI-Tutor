import { streamChatAnswer } from "@/lib/gemini";
import { withRetry } from "@/lib/retry";
import { describeApiError } from "@/lib/describeApiError";
import { MESSAGES } from "@/lib/messages";
import type { ChatRequest } from "@/types";

export const maxDuration = 30;

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
      { error: describeApiError(err, MESSAGES.api.chatFallback) },
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
