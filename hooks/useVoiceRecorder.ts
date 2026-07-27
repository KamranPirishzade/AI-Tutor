"use client";

import { useRef, useState } from "react";
import { getSupportedRecordingMimeType } from "@/lib/mediaRecorder";

/** Wraps the browser's MediaRecorder API behind a simple start/stop pair.
 * stopRecording() resolves with the recorded audio once the recorder has
 * actually finished flushing its data, so callers can just `await` it
 * instead of juggling an `onstop` callback themselves. */
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  async function startRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getSupportedRecordingMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recordedChunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunksRef.current.push(event.data);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }

  function stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        resolve(new Blob());
        return;
      }

      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((track) => track.stop());
        resolve(new Blob(recordedChunksRef.current, { type: recorder.mimeType }));
      };
      recorder.stop();
      setIsRecording(false);
    });
  }

  return { isRecording, startRecording, stopRecording };
}
