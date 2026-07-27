"use client";

import { useState } from "react";
import { renderPdfToImages, type RenderedSlide } from "@/lib/pdfRender";

export function UploadZone({
  onReady,
}: {
  onReady: (deckId: string, slides: RenderedSlide[]) => void;
}) {
  const [status, setStatus] = useState<"idle" | "rendering" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setError("Zəhmət olmasa yalnız PDF fayl yükləyin.");
      setStatus("error");
      return;
    }
    setStatus("rendering");
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const slides = await renderPdfToImages(buffer);
      if (slides.length === 0) {
        throw new Error("PDF-də heç bir səhifə tapılmadı.");
      }
      onReady(crypto.randomUUID(), slides);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fayl emal edilərkən xəta baş verdi.");
      setStatus("error");
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">AI Repetitor</h1>
      <p className="max-w-md text-center text-neutral-500">
        Təqdimatınızı (PDF formatında) yükləyin — AI onu Azərbaycan dilində sizə izah
        etsin.
      </p>
      <label className="cursor-pointer rounded-lg border-2 border-dashed border-neutral-400 px-12 py-16 text-center transition hover:border-neutral-600">
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          disabled={status === "rendering"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {status === "rendering" ? "Slaydlar hazırlanır..." : "PDF seçmək üçün klikləyin"}
      </label>
      {error && <p className="text-red-600">{error}</p>}
    </main>
  );
}
