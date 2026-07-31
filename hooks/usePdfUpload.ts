"use client";

import { useState } from "react";
import { toast } from "sonner";
import { renderPdfToImages, type RenderedSlide } from "@/lib/pdfRender";
import { PDF_MIME_TYPE, UPLOAD_STATUS, type UploadStatus } from "@/lib/constants";
import { MESSAGES } from "@/lib/messages";

export function usePdfUpload(onReady: (deckId: string, slides: RenderedSlide[]) => void) {
  const [status, setStatus] = useState<UploadStatus>(UPLOAD_STATUS.IDLE);

  async function handleFileSelected(file: File) {
    if (file.type !== PDF_MIME_TYPE) {
      toast.error(MESSAGES.upload.invalidFileType);
      return;
    }

    setStatus(UPLOAD_STATUS.RENDERING);
    try {
      const buffer = await file.arrayBuffer();
      const slides = await renderPdfToImages(buffer);
      if (slides.length === 0) {
        toast.error(MESSAGES.upload.noPages);
        return;
      }
      onReady(crypto.randomUUID(), slides);
    } catch (err) {
      console.error("[usePdfUpload]", err);
      toast.error(MESSAGES.upload.processingFailed);
    } finally {
      setStatus(UPLOAD_STATUS.IDLE);
    }
  }

  return { status, handleFileSelected };
}
