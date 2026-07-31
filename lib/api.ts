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

export async function streamText(
  url: string,
  body: unknown,
  onChunk: (accumulatedText: string) => void
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.error ?? `Server xətası (${res.status}). Yenidən cəhd edin.`);
  }
  if (!res.body) {
    throw new Error("Server cavabı boşdur.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });
    onChunk(accumulated);
  }

  return accumulated;
}
