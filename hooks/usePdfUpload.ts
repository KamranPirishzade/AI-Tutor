"use client";

import { useState } from "react";
import { toast } from "sonner";
import { renderPdfToImages, type RenderedSlide } from "@/lib/pdfRender";

type UploadStatus = "idle" | "rendering";

/** Validates the selected file, rasterizes it to per-slide images via pdf.js,
 * and hands the result up to the caller. Owns nothing beyond that one action. */
export function usePdfUpload(onReady: (deckId: string, slides: RenderedSlide[]) => void) {
  const [status, setStatus] = useState<UploadStatus>("idle");

  async function handleFileSelected(file: File) {
    if (file.type !== "application/pdf") {
      toast.error("Zəhmət olmasa yalnız PDF fayl yükləyin.");
      return;
    }

    setStatus("rendering");
    try {
      const buffer = await file.arrayBuffer();
      const slides = await renderPdfToImages(buffer);
      if (slides.length === 0) {
        toast.error("PDF-də heç bir səhifə tapılmadı.");
        return;
      }
      onReady(crypto.randomUUID(), slides);
    } catch (err) {
      // pdf.js's own errors are internal/English — don't leak them, just log.
      console.error("[usePdfUpload]", err);
      toast.error("Fayl emal edilərkən xəta baş verdi. Başqa bir PDF ilə cəhd edin.");
    } finally {
      setStatus("idle");
    }
  }

  return { status, handleFileSelected };
}
