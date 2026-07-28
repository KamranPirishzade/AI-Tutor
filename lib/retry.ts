import { parseRateLimitInfo, isNetworkError } from "./geminiErrorInfo";

// Every route calling this has `maxDuration = 30`, and the Gemini call
// itself can easily take 5-20s on its own — so a retry wait needs to stay
// well under that, or it risks the whole route getting killed by the
// platform instead of returning a clear error. If Google's suggested delay
// is longer than this, retrying here is pointless: fail fast instead and
// tell the user the real wait time so they know retrying immediately won't
// help either.
const MAX_RETRY_DELAY_MS = 10_000;
const NETWORK_RETRY_DELAY_MS = 1500;
const MAX_NETWORK_RETRIES = 1;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retries a Gemini call on 429s using Google's own suggested wait time
 * (not a guessed exponential backoff), and once on a plain network blip.
 * Never retries a daily-quota error or a rate limit whose suggested wait
 * is too long to fit — those are surfaced immediately instead. */
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let networkRetries = 0;

  for (;;) {
    try {
      return await fn();
    } catch (err) {
      const rateLimit = parseRateLimitInfo(err);

      if (rateLimit.isRateLimited && !rateLimit.isDailyQuota) {
        const delayMs = (rateLimit.retryDelaySeconds ?? 5) * 1000;
        if (delayMs <= MAX_RETRY_DELAY_MS) {
          await sleep(delayMs);
          continue;
        }
      }

      if (isNetworkError(err) && networkRetries < MAX_NETWORK_RETRIES) {
        networkRetries++;
        await sleep(NETWORK_RETRY_DELAY_MS);
        continue;
      }

      throw err;
    }
  }
}
