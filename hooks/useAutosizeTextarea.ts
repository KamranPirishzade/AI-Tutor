"use client";

import { useLayoutEffect, useRef } from "react";

export function useAutosizeTextarea(value: string, maxRows = 4) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const style = window.getComputedStyle(textarea);
    const borderHeight =
      (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0);
    const paddingHeight = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const maxHeight = lineHeight * maxRows + paddingHeight + borderHeight;

    textarea.style.height = "auto";
    const contentHeight = textarea.scrollHeight + borderHeight;

    if (contentHeight <= maxHeight) {
      textarea.style.height = `${contentHeight}px`;
      textarea.style.overflowY = "hidden";
    } else {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = "auto";
    }
  }, [value, maxRows]);

  return textareaRef;
}
