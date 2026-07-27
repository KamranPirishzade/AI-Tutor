export interface RenderedSlide {
  index: number;
  dataUrl: string;
}

const TARGET_LONG_EDGE_PX = 1280;

export async function renderPdfToImages(
  arrayBuffer: ArrayBuffer
): Promise<RenderedSlide[]> {
  // Dynamic import, not a top-level one: pdfjs-dist references the browser
  // global DOMMatrix at module-evaluation time, which crashes Next's SSR
  // pass even inside a 'use client' component (Next still evaluates client
  // component modules on the server for the initial HTML).
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const slides: RenderedSlide[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = TARGET_LONG_EDGE_PX / Math.max(baseViewport.width, baseViewport.height);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not get 2D canvas context");
    }

    await page.render({ canvas, canvasContext: context, viewport }).promise;

    slides.push({
      index: pageNum - 1,
      dataUrl: canvas.toDataURL("image/jpeg", 0.85),
    });
  }

  return slides;
}
