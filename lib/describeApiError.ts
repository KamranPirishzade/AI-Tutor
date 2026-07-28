import { parseRateLimitInfo, isNetworkError } from "./geminiErrorInfo";

/** Turns a caught error into a specific, honest Azerbaijani message instead
 * of a generic "try again" — a daily quota, a per-minute rate limit, and a
 * network blip all need the user to do something different, and "try
 * again" immediately only actually works for the last one. */
export function describeApiError(err: unknown, fallbackMessage: string): string {
  const rateLimit = parseRateLimitInfo(err);

  if (rateLimit.isDailyQuota) {
    return "Gündəlik AI istifadə limitinə çatılıb. Sabah yenidən cəhd edin və ya hesabda billing aktivləşdirin.";
  }

  if (rateLimit.isRateLimited) {
    const seconds = rateLimit.retryDelaySeconds ?? 30;
    return `AI hazırda həddindən artıq məşğuldur. Zəhmət olmasa ~${seconds} saniyə gözləyib yenidən cəhd edin.`;
  }

  if (isNetworkError(err)) {
    return "Şəbəkə bağlantısında xəta baş verdi. İnternet bağlantınızı yoxlayıb yenidən cəhd edin.";
  }

  return fallbackMessage;
}
