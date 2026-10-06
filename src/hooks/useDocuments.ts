"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Doc } from "@/lib/types";
import {
  loadActiveId,
  loadDocs,
  newId,
  saveActiveId,
  saveDocs,
  titleFromMarkdown,
} from "@/lib/storage";
import { WELCOME_MD } from "@/lib/welcome";

type State = { ready: boolean; docs: Doc[]; activeId: string | null };

const SERVER_STATE: State = { ready: false, docs: [], activeId: null };

let state: State = SERVER_STATE;
let initialized = false;
let saveTimer: number | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function schedulePersist() {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveDocs(state.docs);
    saveTimer = null;
  }, 250);
}

function setState(patch: Partial<State>, persist = true) {
  state = { ...state, ...patch };
  if (persist && patch.docs) schedulePersist();
  if (patch.activeId !== undefined) saveActiveId(patch.activeId);
  emit();
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  let docs = loadDocs();
  if (docs.length === 0) {
    const now = Date.now();
    docs = [
      {
        id: newId(),
        title: titleFromMarkdown(WELCOME_MD),
        content: WELCOME_MD,
        createdAt: now,
        updatedAt: now,
      },
    ];
    saveDocs(docs);
  }
  docs.sort((a, b) => b.updatedAt - a.updatedAt);
  const stored = loadActiveId();
  const activeId = stored && docs.some((d) => d.id === stored) ? stored : docs[0].id;
  state = { ready: true, docs, activeId };
  window.addEventListener("beforeunload", () => {
    if (saveTimer) {
      window.clearTimeout(saveTimer);
      saveDocs(state.docs);
    }
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!initialized) {
    init();
    // Defer so the first client render still matches the server snapshot.
    queueMicrotask(emit);
  }
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => SERVER_STATE;

export function useDocuments() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setActiveId = useCallback((id: string | null) => setState({ activeId: id }), []);

  const createDoc = useCallback((content = "", title?: string) => {
    const now = Date.now();
    const doc: Doc = {
      id: newId(),
      title: title ?? titleFromMarkdown(content, "Sem título"),
      content,
      createdAt: now,
      updatedAt: now,
    };
    setState({ docs: [doc, ...state.docs], activeId: doc.id });
    return doc;
  }, []);

  const updateContent = useCallback((id: string, content: string) => {
    const target = state.docs.find((d) => d.id === id);
    if (!target || target.content === content) return;
    setState({
      docs: state.docs.map((d) => {
        if (d.id !== id) return d;
        // Follow the first heading until the user renames the document by hand.
        const title = d.manualTitle ? d.title : titleFromMarkdown(content, d.title);
        return { ...d, content, title, updatedAt: Date.now() };
      }),
    });
  }, []);

  const renameDoc = useCallback((id: string, title: string) => {
    setState({
      docs: state.docs.map((d) =>
        d.id === id
          ? { ...d, title: title.trim() || "Sem título", manualTitle: true, updatedAt: Date.now() }
          : d,
      ),
    });
  }, []);

  const deleteDoc = useCallback((id: string) => {
    const docs = state.docs.filter((d) => d.id !== id);
    const activeId = state.activeId === id ? (docs[0]?.id ?? null) : state.activeId;
    setState({ docs, activeId });
  }, []);

  const duplicateDoc = useCallback(
    (id: string) => {
      const src = state.docs.find((d) => d.id === id);
      if (!src) return;
      createDoc(src.content, `${src.title} (cópia)`);
    },
    [createDoc],
  );

  const importFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter(
        (f) => /\.(md|markdown|mdx|txt)$/i.test(f.name) || f.type === "text/markdown",
      );
      let last: Doc | null = null;
      for (const file of list) {
        const text = await file.text();
        const base = file.name.replace(/\.(md|markdown|mdx|txt)$/i, "");
        last = createDoc(text, titleFromMarkdown(text, base));
      }
      return last;
    },
    [createDoc],
  );

  const activeDoc = useMemo(
    () => snap.docs.find((d) => d.id === snap.activeId) ?? null,
    [snap.docs, snap.activeId],
  );

  return {
    ready: snap.ready,
    docs: snap.docs,
    activeId: snap.activeId,
    activeDoc,
    setActiveId,
    createDoc,
    updateContent,
    renameDoc,
    deleteDoc,
    duplicateDoc,
    importFiles,
  };
}
