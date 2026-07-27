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
    <main className="grid-paper flex flex-1 flex-col items-center justify-center gap-5 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
          AI Repetitor
        </h1>
        <p className="max-w-sm text-balance text-ink-soft">
          Təqdimatınızı yükləyin — slayd-slayd Azərbaycan dilində izah edim.
        </p>
      </div>

      <label className="group flex cursor-pointer flex-col items-center gap-3 rounded-3xl border border-dashed border-ink-soft/40 bg-surface px-16 py-14 text-center shadow-sm transition hover:border-margin hover:shadow-md">
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
        <span className="font-mono text-xs tracking-widest text-ink-soft uppercase">
          PDF
        </span>
        <span className="text-ink">
          {status === "rendering" ? "Slaydlar hazırlanır..." : "Seçmək üçün klikləyin"}
        </span>
      </label>
    </main>
  );
}
