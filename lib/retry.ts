function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retries on HTTP 429 (rate limit) with exponential backoff. Any other
 * error is thrown immediately — only rate limiting is worth retrying here. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const retries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 2000;

  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status !== 429 || attempt >= retries) {
        throw err;
      }
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
}
