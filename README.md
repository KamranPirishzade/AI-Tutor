# AI Repetitor

An AI study companion that reads an uploaded presentation aloud in Azerbaijani, slide by slide, and answers spoken or typed questions about it — with the referenced term highlighted in its answer, like a tutor marking up your notebook as they talk.

![Upload screen](docs/upload.png)
![Main view — narration + chat](docs/main-view.png)

## What it does

1. **Upload a PDF.** Each page is rasterized to an image entirely in the browser (no server-side file conversion).
2. **Listen.** Gemini generates a short spoken-style explanation of each slide in Azerbaijani, converts it to speech, and the deck auto-advances as each narration finishes. You can also navigate manually (previous/next), with a soft audio/visual crossfade instead of an abrupt cut.
3. **Ask.** A persistent chat panel lets you type a question or hold the mic to ask by voice — voice is transcribed into the text box first so you can review/edit it before sending, rather than firing off a raw audio clip. Sending a question pauses the slide narration (so the two don't talk over each other) and resumes it once the answer finishes playing.
4. **See the answer, not just hear it.** The AI returns a `focusTerm` alongside its answer — the specific word, number, or formula it's referencing — which gets rendered as an animated highlighter-marker stroke in the chat bubble.

## Why it looks the way it does

The visual identity is built around the Azerbaijani/post-Soviet school exercise book (*dəftər*): a faint grid-paper ("kletka") background, and the traditional red vertical margin rule ("sahə xətti") reused literally as the actual divider between the slide viewer and the chat panel — the chat panel *is* the margin column; the AI's answers are marginalia. It's the one deliberately distinctive element; everything else (soft muted palette, generous spacing, quiet type) stays out of its way.

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Route Handlers as a thin HTTP boundary in front of Gemini calls |
| AI | Gemini API (`@google/genai`) | Vision (slide → narration), native TTS, audio understanding (STT), structured JSON output for the answer + focus term |
| PDF rendering | `pdfjs-dist`, client-side | Rasterizing PDFs server-side would need LibreOffice/native canvas — not viable on Vercel serverless. Doing it in the browser sidesteps that entirely |
| Server state | TanStack Query | Per-slide narration/TTS generation is cached (`staleTime: Infinity`) so revisiting a slide never re-triggers a Gemini call |
| Styling | Tailwind CSS 4 | Design tokens (paper/ink/margin/highlight, light+dark) defined as CSS custom properties in `globals.css`, mapped in via `@theme inline` |
| Icons / toasts | `lucide-react`, `sonner` | |

## Architecture

Each Gemini capability gets its own file, not one shared blob:

```
lib/gemini/
  client.ts          shared client singleton, model IDs, the Azerbaijani-only system prompt
  narration.ts        slide image -> spoken-style explanation
  speech.ts            text -> raw PCM audio (Gemini TTS)
  transcription.ts    spoken audio -> text (with an explicit Azerbaijani-vs-Turkish
                       instruction, since they're close enough that models drift)
  chat.ts              question + slide context -> {answerText, focusTerm} as structured JSON
```

Client-side logic follows one rule: **hooks own actions, components only render.**

```
hooks/
  usePdfUpload.ts          file validation + pdf.js rendering
  useIngestSlides.ts       per-slide narration+TTS generation, rate-limited via a semaphore
  useSlideAudioPlayer.ts   playback, auto-advance, manual nav, pause/resume
  useVoiceRecorder.ts      MediaRecorder start/stop as an awaitable pair
  useTranscribeVoice.ts    voice -> text
  useAskQuestion.ts        text question -> Gemini answer + TTS audio
  useChatThread.ts         composes the four hooks above: owns the message list,
                           coordinates pausing the slide narration while a question
                           is being answered so the two audio streams never overlap
```

`app/api/*/route.ts` are intentionally thin — each one calls exactly one `lib/gemini/*` function wrapped in a 429 retry-with-backoff (`lib/retry.ts`), and returns a pre-sanitized Azerbaijani error message rather than leaking raw Gemini/network errors to the client.

## Notable decisions (and constraints that shaped them)

- **PDF only, no PPTX.** Reduces parsing complexity within a tight build window; a PPTX→image pipeline reliably needs LibreOffice, which doesn't run on Vercel serverless.
- **Risk-first build order.** Before any UI was built, the single biggest unknown — whether Gemini's Azerbaijani TTS actually sounds acceptable — was tested and confirmed first, along with a pdf.js-under-Turbopack spike. Both were treated as hard go/no-go gates.
- **Free-tier quota is real and low.** Some Gemini models cap out at ~10-20 requests/day on the free tier — `lib/retry.ts` backs off on 429s, but sustained testing/demo use needs a billing-enabled key.
- **Audio coordination isn't automatic.** The slide narration and a chat answer are two independent `<audio>` elements; `useChatThread` explicitly pauses the narration (with the same crossfade used for manual slide navigation) the instant a question is sent, and resumes it only once the answer finishes playing — otherwise the two play over each other.

## Running locally

```bash
npm install
cp .env.example .env.local   # add your GEMINI_API_KEY — https://aistudio.google.com/apikey
npm run dev
```

## Known limitations

- No automated test suite yet — verification during development was done via ad-hoc Playwright scripts (with all Gemini routes mocked, so it costs no API quota) that were run and discarded rather than committed.
- Not deployed anywhere yet; built and tested locally against `next dev`.
- Mobile/narrow-viewport layout hasn't been specifically checked — the two-pane slide+chat layout is designed for desktop widths.
- PPTX isn't supported (see above) — PDF only.
