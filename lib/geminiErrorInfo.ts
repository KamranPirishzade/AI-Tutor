interface RateLimitInfo {
  isRateLimited: boolean;
  isDailyQuota: boolean;
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
    // intentionally empty
  }

  return { isRateLimited: true, isDailyQuota, retryDelaySeconds };
}

export function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === "TypeError" && /fetch failed/i.test(err.message)) return true;
  const cause = (err as { cause?: { code?: string } }).cause;
  return cause?.code === "ECONNRESET" || cause?.code === "ETIMEDOUT" || cause?.code === "ECONNREFUSED";
}

export function isOverloadedError(err: unknown): boolean {
  return (err as { status?: number })?.status === 503;
}
