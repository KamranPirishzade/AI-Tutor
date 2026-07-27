/**
 * Gemini TTS returns raw headerless PCM (commonly reported as
 * "audio/L16;rate=24000" — 16-bit signed little-endian, mono). Browsers can't
 * play raw PCM via <audio>/Audio(), so every TTS response must be wrapped in
 * a minimal WAV header before being sent to the client.
 */
export function pcmToWav(
  pcmBase64: string,
  sourceMimeType: string,
  numChannels = 1,
  bitsPerSample = 16
): string {
  const rateMatch = sourceMimeType.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

  const pcmData = Buffer.from(pcmBase64, "base64");
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16); // fmt chunk size (PCM)
  header.writeUInt16LE(1, 20); // audio format = 1 (PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]).toString("base64");
}
