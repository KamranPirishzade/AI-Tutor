export function toAudioDataUri(wavBase64: string): string {
  return `data:audio/wav;base64,${wavBase64}`;
}
