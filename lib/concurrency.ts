/** Limits how many async jobs run at once — used to keep parallel per-slide
 * ingest+TTS chains under the Gemini free-tier RPM cap. */
export function createSemaphore(maxConcurrent: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  function acquire(): Promise<void> {
    if (active < maxConcurrent) {
      active++;
      return Promise.resolve();
    }
    return new Promise((resolve) => queue.push(resolve));
  }

  function release() {
    active--;
    const next = queue.shift();
    if (next) {
      active++;
      next();
    }
  }

  return async function withSemaphore<T>(fn: () => Promise<T>): Promise<T> {
    await acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  };
}

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
