"use client";

import { useRef, useState } from "react";
import {
  Copy,
  FileText,
  FolderOpen,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Sun,
  Trash2,
} from "lucide-react";
import type { Doc, Theme } from "@/lib/types";
import { Menu, MenuItem, MenuSeparator } from "./ui/Menu";
import { BrandLogo } from "./BrandLogo";

type Props = {
  docs: Doc[];
  activeId: string | null;
  theme: Theme;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onImport: (files: FileList) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onToggleTheme: () => void;
};

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} d`;
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function Sidebar({
  docs,
  activeId,
  theme,
  onSelect,
  onCreate,
  onImport,
  onDelete,
  onDuplicate,
  onRename,
  onToggleTheme,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const filtered = query.trim()
    ? docs.filter((d) => d.title.toLowerCase().includes(query.trim().toLowerCase()))
    : docs;

  const startRename = (doc: Doc) => {
    setEditingId(doc.id);
    setDraft(doc.title);
  };

  const commitRename = () => {
    if (editingId) onRename(editingId, draft);
    setEditingId(null);
  };

  return (
    <aside className="no-print flex h-full w-72 shrink-0 flex-col border-r border-border bg-surface-2/60">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <BrandLogo className="h-8 w-auto shrink-0 text-fg" />
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Tema claro" : "Tema escuro"}
          className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-fg/[0.06] hover:text-fg dark:hover:bg-fg/[0.08]"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      <div className="flex gap-2 px-4 pb-3 pt-1">
        <button
          type="button"
          onClick={onCreate}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-fg text-sm font-medium text-accent-fg shadow-sm transition-transform active:scale-[0.98]"
        >
          <Plus size={15} strokeWidth={2.2} />
          Novo
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="Importar arquivos .md"
          className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-fg transition-colors hover:bg-fg/[0.03] active:scale-[0.98] dark:hover:bg-fg/[0.06]"
        >
          <FolderOpen size={15} strokeWidth={1.9} />
          Importar
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".md,.markdown,.mdx,.txt,text/markdown"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) onImport(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="px-4 pb-2">
        <label className="flex h-9 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm focus-within:border-border-strong">
          <Search size={14} className="shrink-0 text-fg-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar documentos"
            className="w-full bg-transparent outline-none placeholder:text-fg-faint"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <div className="px-2 pb-1.5 pt-2 text-[11px] font-medium uppercase tracking-wider text-fg-faint">
          Documentos · {docs.length}
        </div>
        {filtered.length === 0 && (
          <div className="px-3 py-8 text-center text-sm text-fg-muted">
            {query ? "Nenhum documento encontrado." : "Crie ou importe um documento."}
          </div>
        )}
        <ul className="space-y-0.5">
          {filtered.map((doc) => {
            const active = doc.id === activeId;
            const editing = editingId === doc.id;
            return (
              <li key={doc.id} className="group relative">
                {editing ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-sm outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelect(doc.id)}
                    onDoubleClick={() => startRename(doc)}
                    className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left transition-colors ${
                      active
                        ? "bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.05)] ring-1 ring-border"
                        : "hover:bg-fg/[0.04] dark:hover:bg-fg/[0.06]"
                    }`}
                  >
                    <FileText size={15} strokeWidth={1.8} className={`mt-0.5 shrink-0 ${active ? "text-fg" : "text-fg-faint"}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm ${active ? "font-medium text-fg" : "text-fg"}`}>
                        {doc.title || "Sem título"}
                      </span>
                      <span className="block text-xs text-fg-faint">{relativeTime(doc.updatedAt)}</span>
                    </span>
                  </button>
                )}
                {!editing && (
                  <Menu
                    align="right"
                    className="absolute right-1.5 top-1.5"
                    trigger={({ open, toggle }) => (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle();
                        }}
                        aria-label="Opções"
                        className={`grid h-7 w-7 place-items-center rounded-lg text-fg-muted transition-opacity hover:bg-fg/[0.08] ${
                          open ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                    )}
                  >
                    {(close) => (
                      <>
                        <MenuItem icon={<Pencil size={14} />} label="Renomear" onClick={() => { startRename(doc); close(); }} />
                        <MenuItem icon={<Copy size={14} />} label="Duplicar" onClick={() => { onDuplicate(doc.id); close(); }} />
                        <MenuSeparator />
                        <MenuItem icon={<Trash2 size={14} />} label="Excluir" danger onClick={() => { onDelete(doc.id); close(); }} />
                      </>
                    )}
                  </Menu>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-border px-4 py-3 text-[11px] leading-relaxed text-fg-faint">
        Salvo automaticamente neste navegador.
      </div>
    </aside>
  );
}
