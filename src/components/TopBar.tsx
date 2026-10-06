"use client";

import { useState } from "react";
import { ChevronDown, Download, FileCode2, FileText, FileType2, Loader2, PanelLeft } from "lucide-react";
import type { Doc } from "@/lib/types";
import { Menu, MenuItem } from "./ui/Menu";

type Props = {
  doc: Doc;
  exporting: "pdf" | "docx" | "md" | null;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onRename: (id: string, title: string) => void;
  onExport: (format: "pdf" | "docx" | "md") => void;
};

function countWords(md: string) {
  const text = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-|[\]()!]/g, " ")
    .trim();
  return text ? text.split(/\s+/).length : 0;
}

export function TopBar({ doc, exporting, sidebarOpen, onToggleSidebar, onRename, onExport }: Props) {
  const [title, setTitle] = useState(doc.title);
  const [synced, setSynced] = useState(doc.title);

  // Re-sync the local draft whenever the document title changes externally.
  if (doc.title !== synced) {
    setSynced(doc.title);
    setTitle(doc.title);
  }

  const commit = () => {
    if (title.trim() !== doc.title) onRename(doc.id, title);
  };

  const words = countWords(doc.content);

  return (
    <header className="no-print flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface/70 px-3 backdrop-blur-xl sm:px-4">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? "Ocultar painel" : "Mostrar painel"}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-fg/[0.06] hover:text-fg dark:hover:bg-fg/[0.08]"
      >
        <PanelLeft size={16} strokeWidth={1.9} />
      </button>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setTitle(doc.title);
            (e.target as HTMLInputElement).blur();
          }
        }}
        aria-label="Título do documento"
        placeholder="Sem título"
        className="h-9 min-w-0 flex-1 rounded-lg bg-transparent px-2 text-[15px] font-medium tracking-tight text-fg outline-none transition-colors placeholder:text-fg-faint hover:bg-fg/[0.04] focus:bg-fg/[0.05] dark:hover:bg-fg/[0.06] dark:focus:bg-fg/[0.08]"
      />

      <span className="hidden shrink-0 text-xs tabular-nums text-fg-faint sm:block">
        {words} {words === 1 ? "palavra" : "palavras"}
      </span>

      <Menu
        align="right"
        trigger={({ toggle }) => (
          <button
            type="button"
            onClick={toggle}
            disabled={exporting !== null}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-fg px-3.5 text-sm font-medium text-accent-fg shadow-sm transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} strokeWidth={2} />}
            <span className="hidden sm:inline">Exportar</span>
            <ChevronDown size={14} className="opacity-70" />
          </button>
        )}
      >
        {(close) => (
          <>
            <MenuItem icon={<FileText size={15} />} label="PDF" hint=".pdf" onClick={() => { onExport("pdf"); close(); }} />
            <MenuItem icon={<FileType2 size={15} />} label="Word" hint=".docx" onClick={() => { onExport("docx"); close(); }} />
            <MenuItem icon={<FileCode2 size={15} />} label="Markdown" hint=".md" onClick={() => { onExport("md"); close(); }} />
          </>
        )}
      </Menu>
    </header>
  );
}
