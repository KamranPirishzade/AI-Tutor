/** Gemini's @google/genai SDK stringifies the raw REST error body into
 * Error.message, so it can be parsed back out — this is how we tell "wait
 * 30s and retry" apart from "you're done for today" apart from a plain
 * network blip, instead of treating every failure the same way. */

interface RateLimitInfo {
  isRateLimited: boolean;
  /** True for a per-day quota — retrying within this session cannot help. */
  isDailyQuota: boolean;
  /** Google's own suggested wait, parsed from the error body, if present. */
  retryDelaySeconds: number | null;
}

export function parseRateLimitInfo(err: unknown): RateLimitInfo {
  const status = (err as { status?: number })?.status;
  if (status !== 429) {
    return { isRateLimited: false, isDailyQuota: false, retryDelaySeconds: null };
  }

  let isDailyQuota = false;
  let retryDelaySeconds: number | null = null;

  const message = (err as { message?: string })?.message;
  try {
    const details: unknown[] = message ? JSON.parse(message)?.error?.details ?? [] : [];
    for (const raw of details) {
      const detail = raw as {
        ["@type"]?: string;
        retryDelay?: string;
        violations?: Array<{ quotaId?: string }>;
      };
      if (detail["@type"]?.includes("RetryInfo") && typeof detail.retryDelay === "string") {
        const match = detail.retryDelay.match(/^([\d.]+)s$/);
        if (match) retryDelaySeconds = Math.ceil(parseFloat(match[1]));
      }
      if (detail["@type"]?.includes("QuotaFailure")) {
        const quotaId = detail.violations?.[0]?.quotaId ?? "";
        if (quotaId.includes("PerDay")) isDailyQuota = true;
      }
    }
  } catch {
    // message wasn't the JSON shape we expected — still rate-limited,
    // just without the extra detail.
  }

  return { isRateLimited: true, isDailyQuota, retryDelaySeconds };
}

/** A plain connection blip (reset, timeout, DNS hiccup) — worth one quick
 * retry, unlike a Gemini-side quota error. */
export function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === "TypeError" && /fetch failed/i.test(err.message)) return true;
  const cause = (err as { cause?: { code?: string } }).cause;
  return cause?.code === "ECONNRESET" || cause?.code === "ETIMEDOUT" || cause?.code === "ECONNREFUSED";
}

/** Gemini's "the model is currently experiencing high demand" response —
 * a transient capacity issue on Google's side, unrelated to our own quota.
 * Usually clears within a few seconds, so it's worth a couple of quick
 * retries rather than failing immediately like a quota error would. */
export function isOverloadedError(err: unknown): boolean {
  return (err as { status?: number })?.status === 503;
}
