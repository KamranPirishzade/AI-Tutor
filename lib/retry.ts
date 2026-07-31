import { parseRateLimitInfo, isNetworkError, isOverloadedError } from "./geminiErrorInfo";

const MAX_RETRY_DELAY_MS = 10_000;
const NETWORK_RETRY_DELAY_MS = 1500;
const MAX_NETWORK_RETRIES = 1;
const OVERLOADED_RETRY_DELAY_MS = 2000;
const MAX_OVERLOADED_RETRIES = 2;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let networkRetries = 0;
  let overloadedRetries = 0;

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

      if (isOverloadedError(err) && overloadedRetries < MAX_OVERLOADED_RETRIES) {
        overloadedRetries++;
        await sleep(OVERLOADED_RETRY_DELAY_MS);
        continue;
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
