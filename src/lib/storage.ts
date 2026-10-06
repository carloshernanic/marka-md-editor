import type { Doc } from "./types";

const DOCS_KEY = "marka:docs";
const ACTIVE_KEY = "marka:active";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadDocs(): Doc[] {
  if (typeof window === "undefined") return [];
  const docs = safeParse<Doc[]>(localStorage.getItem(DOCS_KEY), []);
  return Array.isArray(docs) ? docs : [];
}

export function saveDocs(docs: Doc[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
  } catch (err) {
    console.error("Não foi possível salvar os documentos", err);
  }
}

export function loadActiveId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Derives a title from markdown: first heading, else first non-empty line. */
export function titleFromMarkdown(md: string, fallback = "Sem título"): string {
  const lines = md.split(/\r?\n/);
  for (const line of lines) {
    const h = line.match(/^#{1,6}\s+(.+)$/);
    if (h) return cleanInline(h[1]);
  }
  for (const line of lines) {
    const t = line.trim();
    if (t && !/^(```|---|\|)/.test(t)) return cleanInline(t).slice(0, 80);
  }
  return fallback;
}

function cleanInline(s: string) {
  return s
    .replace(/[*_`~]/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

export function slugify(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "documento"
  );
}
