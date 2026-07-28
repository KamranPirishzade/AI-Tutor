import type { SlideTextItem } from "@/types";
import type { PageViewport, PDFPageProxy } from "pdfjs-dist";

export interface RenderedSlide {
  index: number;
  dataUrl: string;
  textItems: SlideTextItem[];
}

const TARGET_LONG_EDGE_PX = 1280;

/** Composes two PDF affine transform matrices [a,b,c,d,e,f] — same
 * convention pdf.js's own Util.transform uses (apply m2, then m1). */
function multiplyTransforms(m1: number[], m2: number[]): number[] {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

/** Extracts each text run's position on the page, expressed as 0-1
 * fractions of the (unscaled) page's width/height — resolution-independent,
 * so it lines up with the rendered image at any display size. Used later
 * to draw a focus highlight in its real position (see
 * lib/findFocusHighlight.ts) instead of only bolding it in the chat.
 *
 * Algorithm matches pdf.js's own text-layer builder: item.width/height are
 * in raw PDF-point units, not pre-scaled to any rendering viewport, so they
 * pair with a plain page Y-flip — not with the scaled rendering viewport's
 * transform (that was tried first and produced wildly oversized boxes,
 * because it double-applied scale that item.width already accounts for).
 */
async function extractTextItems(
  page: PDFPageProxy,
  baseViewport: PageViewport
): Promise<SlideTextItem[]> {
  const { items } = await page.getTextContent();
  const [pageX, pageY] = baseViewport.viewBox;
  const pageWidth = baseViewport.width;
  const pageHeight = baseViewport.height;
  const flipTransform = [1, 0, 0, -1, -pageX, pageY + pageHeight];

  const textItems: SlideTextItem[] = [];

  for (const item of items) {
    if (!("str" in item) || !("transform" in item) || item.str.trim().length === 0) {
      continue;
    }

    const tx = multiplyTransforms(flipTransform, item.transform);
    const fontHeight = Math.hypot(tx[2], tx[3]);
    const left = tx[4];
    const top = tx[5] - fontHeight;

    textItems.push({
      text: item.str,
      left: left / pageWidth,
      top: top / pageHeight,
      width: item.width / pageWidth,
      height: fontHeight / pageHeight,
    });
  }

  return textItems;
}

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
    const textItems = await extractTextItems(page, baseViewport);

    slides.push({
      index: pageNum - 1,
      dataUrl: canvas.toDataURL("image/jpeg", 0.85),
      textItems,
    });
  }

  return slides;
}
