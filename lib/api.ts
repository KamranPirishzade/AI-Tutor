/** POSTs JSON to one of our own /api/* routes and parses the JSON response.
 * Every route returns `{ error: string }` (already Azerbaijani) on failure. */
export async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.error ?? `Server xətası (${res.status}). Yenidən cəhd edin.`);
  }
  return res.json() as Promise<TResponse>;
}
