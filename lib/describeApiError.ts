import { parseRateLimitInfo, isNetworkError, isOverloadedError } from "./geminiErrorInfo";
import { MESSAGES } from "./messages";

export function describeApiError(err: unknown, fallbackMessage: string): string {
  const rateLimit = parseRateLimitInfo(err);

  if (rateLimit.isDailyQuota) {
    return MESSAGES.api.dailyQuotaExceeded;
  }

  if (rateLimit.isRateLimited) {
    return MESSAGES.api.rateLimited(rateLimit.retryDelaySeconds ?? 30);
  }

  if (isNetworkError(err)) {
    return MESSAGES.api.networkError;
  }

  if (isOverloadedError(err)) {
    return MESSAGES.api.overloaded;
  }

  return fallbackMessage;
}
