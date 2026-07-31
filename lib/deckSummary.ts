import type { Slide } from "@/types";

const SUMMARY_CHARS_PER_SLIDE = 200;

export function buildDeckSummary(slides: Slide[]): string {
  return slides
    .filter((slide) => slide.narrationText)
    .map((slide) => `Slayd ${slide.index + 1}: ${slide.narrationText!.slice(0, SUMMARY_CHARS_PER_SLIDE)}`)
    .join("\n");
}
