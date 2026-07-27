/** Ramps an <audio> element's volume from one level to another over time,
 * so switching slides crossfades instead of cutting abruptly. */
export function fadeAudioVolume(
  audio: HTMLAudioElement,
  from: number,
  to: number,
  durationMs: number,
  onDone?: () => void
) {
  const stepCount = 10;
  let step = 0;

  const intervalId = setInterval(() => {
    step++;
    audio.volume = from + (to - from) * (step / stepCount);
    if (step >= stepCount) {
      clearInterval(intervalId);
      onDone?.();
    }
  }, durationMs / stepCount);
}
