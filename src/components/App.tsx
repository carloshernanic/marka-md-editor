"use client";

import { useCallback, useEffect, useState } from "react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { FileUp, FileText, Plus } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { useTheme } from "@/hooks/useTheme";
import { downloadBlob, downloadMarkdown, exportPdf } from "@/lib/download";
import { slugify } from "@/lib/storage";
import { Editor } from "./editor/Editor";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

type ExportFormat = "pdf" | "docx" | "md";

export function App() {
  const d = useDocuments();
  const { theme, toggle: toggleTheme } = useTheme();
  const [editor, setEditor] = useState<TiptapEditor | null>(null);
  // Collapsed by default on small screens. Safe for SSR: the server renders a
  // spinner until the document store is ready, so this never affects hydration.
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === "undefined" || !window.matchMedia("(max-width: 900px)").matches,
  );
  const [dragging, setDragging] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      const doc = d.activeDoc;
      if (!doc || !editor) return;
      const title = doc.title || "documento";
      setExporting(format);
      try {
        if (format === "md") {
          downloadMarkdown(editor.getMarkdown(), title);
        } else if (format === "docx") {
          const { exportDocx } = await import("@/lib/export-docx");
          const blob = await exportDocx(editor.getJSON(), title);
          downloadBlob(blob, `${slugify(title)}.docx`);
        } else {
          exportPdf(title);
        }
      } catch (err) {
        console.error(err);
        setToast("Não foi possível exportar. Tente novamente.");
      } finally {
        setExporting(null);
      }
    },
    [d.activeDoc, editor],
  );

  const handleImport = useCallback(
    async (files: FileList | File[]) => {
      const last = await d.importFiles(files);
      if (last) setToast(`Importado: ${last.title}`);
      else setToast("Nenhum arquivo .md encontrado.");
    },
    [d],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const doc = d.docs.find((x) => x.id === id);
      if (!doc) return;
      if (window.confirm(`Excluir “${doc.title}”? Esta ação não pode ser desfeita.`)) {
        d.deleteDoc(id);
      }
    },
    [d],
  );

  // Global shortcuts: Ctrl+S (export md), Ctrl+P (pdf), Ctrl+O (import), Ctrl+Alt+N (new).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        void handleExport("md");
      } else if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        void handleExport("pdf");
      } else if (e.key.toLowerCase() === "n" && e.altKey) {
        e.preventDefault();
        d.createDoc("");
      } else if (e.key === "\\") {
        e.preventDefault();
        setSidebarOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleExport, d]);

  const onDragOver = (e: React.DragEvent) => {
    if (Array.from(e.dataTransfer.types).includes("Files")) {
      e.preventDefault();
      setDragging(true);
    }
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) void handleImport(e.dataTransfer.files);
  };

  if (!d.ready) {
    return (
      <div className="grid h-full place-items-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-strong border-t-fg" />
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full"
      onDragOver={onDragOver}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={onDrop}
    >
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fechar painel"
          onClick={() => setSidebarOpen(false)}
          className="no-print fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] md:hidden"
        />
      )}
      <div
        className={`no-print fixed inset-y-0 left-0 z-40 h-full shrink-0 overflow-hidden transition-[width] duration-200 ease-out md:relative md:z-auto ${
          sidebarOpen ? "w-72" : "w-0"
        }`}
      >
        <Sidebar
          docs={d.docs}
          activeId={d.activeId}
          theme={theme}
          onSelect={(id) => {
            d.setActiveId(id);
            if (window.matchMedia("(max-width: 900px)").matches) setSidebarOpen(false);
          }}
          onCreate={() => d.createDoc("")}
          onImport={handleImport}
          onDelete={handleDelete}
          onDuplicate={d.duplicateDoc}
          onRename={d.renameDoc}
          onToggleTheme={toggleTheme}
        />
      </div>

      <main className="flex min-w-0 flex-1 flex-col">
        {d.activeDoc ? (
          <>
            <TopBar
              doc={d.activeDoc}
              exporting={exporting}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((o) => !o)}
              onRename={d.renameDoc}
              onExport={(f) => void handleExport(f)}
            />
            <div className="min-h-0 flex-1">
              <Editor doc={d.activeDoc} onChange={d.updateContent} onEditor={setEditor} />
            </div>
          </>
        ) : (
          <div className="grid h-full place-items-center p-8">
            <div className="max-w-sm text-center">
              <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-border bg-surface shadow-sm">
                <FileText size={20} strokeWidth={1.6} className="text-fg-muted" />
              </span>
              <h2 className="text-lg font-semibold tracking-tight">Nenhum documento aberto</h2>
              <p className="mt-1.5 text-sm text-fg-muted">
                Crie um novo documento ou arraste arquivos .md para esta janela.
              </p>
              <button
                type="button"
                onClick={() => d.createDoc("")}
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-fg px-4 text-sm font-medium text-accent-fg shadow-sm active:scale-[0.98]"
              >
                <Plus size={16} />
                Novo documento
              </button>
            </div>
          </div>
        )}
      </main>

      {dragging && (
        <div className="no-print pointer-events-none absolute inset-3 z-50 grid place-items-center rounded-3xl border-2 border-dashed border-fg/40 bg-bg/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-3 shadow-pop">
            <FileUp size={18} className="text-fg-muted" />
            <span className="text-sm font-medium">Solte para importar</span>
          </div>
        </div>
      )}

      {toast && (
        <div className="no-print animate-pop pointer-events-none absolute bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-surface px-4 py-2 text-sm shadow-pop">
          {toast}
        </div>
      )}
    </div>
  );
}
