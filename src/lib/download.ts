import { saveAs } from "file-saver";
import { slugify } from "./storage";

export function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

export function downloadMarkdown(markdown: string, title: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  downloadBlob(blob, `${slugify(title)}.md`);
}

/**
 * Exports the current page to PDF using the browser's print engine.
 * The print stylesheet in globals.css hides everything except the document.
 */
export function exportPdf(title: string) {
  const prev = document.title;
  document.title = title;
  const restore = () => {
    document.title = prev;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  // Give the browser a tick to apply the title before opening the dialog.
  requestAnimationFrame(() => window.print());
}
