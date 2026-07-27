"use client";

import { usePdfUpload } from "@/hooks/usePdfUpload";
import type { RenderedSlide } from "@/lib/pdfRender";

export function UploadZone({
  onReady,
}: {
  onReady: (deckId: string, slides: RenderedSlide[]) => void;
}) {
  const { status, handleFileSelected } = usePdfUpload(onReady);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">AI Repetitor</h1>
      <p className="max-w-md text-center text-neutral-500 dark:text-neutral-400">
        Təqdimatınızı (PDF formatında) yükləyin — AI onu Azərbaycan dilində sizə izah
        etsin.
      </p>
      <label className="cursor-pointer rounded-lg border-2 border-dashed border-neutral-400 px-12 py-16 text-center transition hover:border-neutral-600 dark:border-neutral-600 dark:hover:border-neutral-400">
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          disabled={status === "rendering"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelected(file);
          }}
        />
        {status === "rendering" ? "Slaydlar hazırlanır..." : "PDF seçmək üçün klikləyin"}
      </label>
    </main>
  );
}
