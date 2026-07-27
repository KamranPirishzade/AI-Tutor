/**
 * Phase 1 risk-gate smoke test — throwaway script, not part of the app.
 * Run with: npx tsx scripts/smoketest.ts
 *
 * Validates (see plan risk gates):
 *  1. Basic connectivity + Azerbaijani instruction-following (text-only).
 *  2. Which models currently exist that support TTS (models.list()).
 *  3. Vision call accepts inline image data (placeholder 1x1 PNG — NOT a
 *     real slide, so narration *content* quality is not judged here; only
 *     that the vision path works and the model still answers in Azerbaijani).
 *  4. TTS: generate audio, wrap as WAV, write to disk for manual listening.
 *     >>> THIS IS THE ONE STEP YOU MUST JUDGE BY EAR. <<<
 *  5. Audio-understanding: feed the TTS output back in as a mock spoken
 *     question, to check the audio-in/JSON-out chat path end-to-end.
 *     NOTE: this uses a WAV clip, not a browser-recorded webm/opus clip, so
 *     it does NOT settle the "does Gemini accept webm/opus" question — that
 *     needs a real MediaRecorder capture in Phase 3.
 */
import * as fs from "node:fs";
import * as path from "node:path";

// .env.local isn't auto-loaded outside `next dev` — load it manually here.
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].trim();
  }
}

import { GoogleGenAI, Type } from "@google/genai";
import { AZERBAIJANI_SYSTEM_PROMPT, TEXT_MODEL, TTS_MODEL, TTS_VOICE } from "../lib/gemini";
import { pcmToWav } from "../lib/wav";

const PLACEHOLDER_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env.local — aborting.");
    process.exit(1);
  }
  const ai = new GoogleGenAI({ apiKey });

  console.log("=== 1. Text connectivity + Azerbaijani instruction-following ===");
  try {
    const res = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ role: "user", parts: [{ text: "Salam, sən kimsən? Özünü tanıt." }] }],
      config: { systemInstruction: AZERBAIJANI_SYSTEM_PROMPT },
    });
    console.log("Model:", TEXT_MODEL);
    console.log("Response:", res.text);
  } catch (err) {
    console.error("FAILED:", err);
  }

  console.log("\n=== 2. Listing models that mention 'tts' (to confirm TTS_MODEL id) ===");
  try {
    const pager = await ai.models.list();
    const ttsModels: string[] = [];
    for await (const model of pager) {
      if (model.name?.toLowerCase().includes("tts")) {
        ttsModels.push(`${model.name} | actions: ${model.supportedActions?.join(",")}`);
      }
    }
    console.log("Configured TTS_MODEL constant:", TTS_MODEL);
    console.log("TTS-capable models found via API:");
    ttsModels.forEach((m) => console.log(" -", m));
    if (!ttsModels.some((m) => m.includes(TTS_MODEL))) {
      console.warn(
        `WARNING: TTS_MODEL ("${TTS_MODEL}") was not found in the list above. Update lib/gemini.ts.`
      );
    }
  } catch (err) {
    console.error("FAILED:", err);
  }

  console.log("\n=== 3. Vision call (placeholder image, not a real slide) ===");
  try {
    const res = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/png", data: PLACEHOLDER_PNG_BASE64 } },
            { text: "Bu şəkil haqqında bir cümlə yaz." },
          ],
        },
      ],
      config: { systemInstruction: AZERBAIJANI_SYSTEM_PROMPT },
    });
    console.log("Response:", res.text);
    console.log(
      "(This only proves the vision path + Azerbaijani instruction works end-to-end — " +
        "re-test narration QUALITY once a real slide image is available.)"
    );
  } catch (err) {
    console.error("FAILED:", err);
  }

  console.log("\n=== 4. TTS call — WRITES A WAV FILE, LISTEN TO IT MANUALLY ===");
  let ttsWavBase64: string | null = null;
  try {
    const res = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: "Salam! Bu, süni intellektin Azərbaycan dilində danışıq testidir." }],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: TTS_VOICE } } },
      },
    });
    const part = res.candidates?.[0]?.content?.parts?.[0];
    const audioMime = part?.inlineData?.mimeType ?? "audio/L16;rate=24000";
    const audioB64 = res.data ?? part?.inlineData?.data;
    if (!audioB64) throw new Error("No audio data in response");
    console.log("Raw audio mimeType returned by Gemini:", audioMime);

    ttsWavBase64 = pcmToWav(audioB64, audioMime);
    const outPath = path.resolve(process.cwd(), "scripts", "smoketest-output.wav");
    fs.writeFileSync(outPath, Buffer.from(ttsWavBase64, "base64"));
    console.log(`WAV file written to: ${outPath}`);
    console.log(">>> OPEN AND LISTEN TO THIS FILE NOW — is Azerbaijani intelligible/natural? <<<");
  } catch (err) {
    console.error("FAILED:", err);
  }

  console.log("\n=== 5. Audio-understanding + structured JSON (using step 4's WAV as input) ===");
  if (!ttsWavBase64) {
    console.log("Skipped — step 4 did not produce audio.");
  } else {
    try {
      const res = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: "audio/wav", data: ttsWavBase64 } },
              {
                text:
                  "Bu audioda nə deyilir? Bunu bir tələbənin sualı kimi qəbul et və qısaca cavab ver. " +
                  "Cavabında konkret bir termin varsa focusTerm-də qeyd et, yoxdursa null et.",
              },
            ],
          },
        ],
        config: {
          systemInstruction: AZERBAIJANI_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answerText: { type: Type.STRING },
              focusTerm: { type: Type.STRING, nullable: true },
            },
            required: ["answerText", "focusTerm"],
          },
        },
      });
      console.log("Raw JSON response:", res.text);
      const parsed = JSON.parse(res.text ?? "{}");
      console.log("Parsed:", parsed);
      console.log(
        "(Confirms WAV audio-in + JSON-mode works. Still need a REAL webm/opus browser " +
          "recording test in Phase 3 to confirm that format specifically.)"
      );
    } catch (err) {
      console.error("FAILED:", err);
    }
  }

  console.log("\n=== Smoke test complete ===");
}

main();
