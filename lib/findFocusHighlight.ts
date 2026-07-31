import type { SlideTextItem } from "@/types";

export interface HighlightBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function findFocusHighlight(
  textItems: SlideTextItem[],
  focusTerm: string
): HighlightBox | null {
  const normalizedTerm = normalize(focusTerm);
  if (!normalizedTerm) return null;

  let haystack = "";
  const charToItemIndex: number[] = [];
  textItems.forEach((item, itemIndex) => {
    if (haystack.length > 0) {
      haystack += " ";
      charToItemIndex.push(-1);
    }
    const normalizedText = normalize(item.text);
    haystack += normalizedText;
    for (let i = 0; i < normalizedText.length; i++) {
      charToItemIndex.push(itemIndex);
    }
  });

  const matchStart = haystack.indexOf(normalizedTerm);
  if (matchStart === -1) return null;
  const matchEnd = matchStart + normalizedTerm.length;

  const touchedIndices = new Set<number>();
  for (let i = matchStart; i < matchEnd; i++) {
    const itemIndex = charToItemIndex[i];
    if (itemIndex !== -1) touchedIndices.add(itemIndex);
  }
  if (touchedIndices.size === 0) return null;

  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const itemIndex of touchedIndices) {
    const item = textItems[itemIndex];
    left = Math.min(left, item.left);
    top = Math.min(top, item.top);
    right = Math.max(right, item.left + item.width);
    bottom = Math.max(bottom, item.top + item.height);
  }

  return { left, top, width: right - left, height: bottom - top };
}
