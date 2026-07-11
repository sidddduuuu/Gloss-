"use client";

import { useEffect, useRef, useState } from "react";
import type { Paper } from "@/lib/papers";

export interface Selection {
  text: string;
  context: string;
  x: number;
  y: number;
}

interface Props {
  paper: Paper;
  onSelect: (sel: Selection) => void;
  onMeta?: (info: { numPages: number; rendered: number }) => void;
}

// Renders a PDF full-width with a selectable text layer. On mouseup with a
// non-empty selection, surfaces the selected string plus surrounding page text
// as context. Uses pdfjs-dist loaded lazily on the client.
export default function PdfReader({ paper, onSelect, onMeta }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pageText, setPageText] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";
    setStatus("loading");
    const texts = new Map<number, string>();

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        // Served from /public — avoids bundler-specific worker resolution.
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const { TextLayer } = pdfjs;

        const doc = await pdfjs.getDocument(paper.file).promise;
        if (cancelled) return;

        const maxPages = Math.min(doc.numPages, 12);
        onMeta?.({ numPages: doc.numPages, rendered: maxPages });
        const width = container.clientWidth || 820;

        let renderedAny = false;
        for (let n = 1; n <= maxPages; n++) {
          if (cancelled) return;
          try {
            const page = await doc.getPage(n);
            if (cancelled) return;
            const unscaled = page.getViewport({ scale: 1 });
            const scale = width / unscaled.width;
            const viewport = page.getViewport({ scale });

            const pageEl = document.createElement("div");
            pageEl.className = "pdf-page";
            pageEl.style.width = `${viewport.width}px`;
            pageEl.style.height = `${viewport.height}px`;
            // Required by pdfjs TextLayer to size/position the selectable text.
            pageEl.style.setProperty("--scale-factor", String(scale));
            pageEl.style.setProperty("--total-scale-factor", String(scale));

            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext("2d")!;
            pageEl.appendChild(canvas);

            const textDiv = document.createElement("div");
            textDiv.className = "pdf-text-layer";
            textDiv.style.width = `${viewport.width}px`;
            textDiv.style.height = `${viewport.height}px`;
            pageEl.appendChild(textDiv);
            container.appendChild(pageEl);

            await page.render({ canvasContext: ctx, viewport, canvas }).promise;

            const textContent = await page.getTextContent();
            texts.set(
              n,
              textContent.items.map((i) => ("str" in i ? i.str : "")).join(" ")
            );
            const textLayer = new TextLayer({ textContentSource: textContent, container: textDiv, viewport });
            await textLayer.render();
            renderedAny = true;
            // Show the reader as soon as the first page is up; keep rendering the rest.
            if (n === 1) setStatus("ready");
          } catch (pageErr) {
            // One bad page must not blank the whole document.
            console.error(`[PdfReader] page ${n} failed`, pageErr);
          }
        }
        if (cancelled) return;
        setPageText(texts);
        setStatus(renderedAny ? "ready" : "error");
      } catch (err) {
        console.error("[PdfReader] document load failed", err);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paper.file]);

  function handleMouseUp() {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    if (!text || text.length < 2) return;

    const range = sel!.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Context: the full text of the page the selection anchor lives on.
    const pageEl = (range.startContainer.parentElement as HTMLElement | null)?.closest(
      ".pdf-page"
    );
    let context = "";
    if (pageEl) {
      const idx = Array.from(pageEl.parentElement!.children).indexOf(pageEl) + 1;
      context = pageText.get(idx) ?? "";
      // Trim to a window around the selection for tighter grounding.
      const at = context.toLowerCase().indexOf(text.toLowerCase().slice(0, 24));
      if (at >= 0) context = context.slice(Math.max(0, at - 600), at + 600);
    }

    onSelect({ text, context, x: rect.left + rect.width / 2, y: rect.top });
  }

  return (
    <div className="reader-scroll" onMouseUp={handleMouseUp}>
      {status === "loading" && <p className="reader-note">Loading {paper.shortTitle}…</p>}
      {status === "error" && (
        <p className="reader-note">Couldn't load this PDF. Check public/papers/.</p>
      )}
      <div ref={containerRef} className="pdf-pages" />
    </div>
  );
}
