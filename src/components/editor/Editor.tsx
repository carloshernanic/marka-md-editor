"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { SlashCommand } from "./slash-command";
import { Toolbar } from "./Toolbar";
import type { Doc } from "@/lib/types";

type Props = {
  doc: Doc;
  onChange: (id: string, markdown: string) => void;
  onEditor: (editor: TiptapEditor | null) => void;
};

export function Editor({ doc, onChange, onEditor }: Props) {
  const docIdRef = useRef(doc.id);
  const timer = useRef<number | null>(null);
  const lastEmitted = useRef<string>(doc.content);

  const editor = useEditor({
    immediatelyRender: false,
    content: doc.content,
    contentType: "markdown",
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      Markdown.configure({ indentation: { style: "space", size: 2 } }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") return `Título ${node.attrs.level}`;
          return "Escreva algo ou digite “/” para comandos…";
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
      Image.configure({ inline: false, allowBase64: true }),
      SlashCommand,
    ],
    editorProps: {
      attributes: {
        class: "tiptap",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: e }) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        const md = e.getMarkdown();
        lastEmitted.current = md;
        onChange(docIdRef.current, md);
      }, 300);
    },
  });

  useEffect(() => {
    onEditor(editor);
    return () => onEditor(null);
  }, [editor, onEditor]);

  // Switch documents: replace editor content without emitting an update.
  useEffect(() => {
    if (!editor) return;
    if (docIdRef.current === doc.id) return;
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
      // Flush pending change for the previous doc.
      const md = editor.getMarkdown();
      if (md !== lastEmitted.current) onChange(docIdRef.current, md);
    }
    docIdRef.current = doc.id;
    lastEmitted.current = doc.content;
    editor.commands.setContent(doc.content, { contentType: "markdown", emitUpdate: false });
    editor.commands.focus("start");
  }, [doc.id, doc.content, editor, onChange]);

  // Flush pending edits on unmount.
  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="no-print sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur-xl">
        {editor ? <Toolbar editor={editor} /> : <div className="h-12" />}
      </div>
      <div className="print-root min-h-0 flex-1 overflow-y-auto px-3 py-6 sm:px-8 sm:py-12">
        <div className="page mx-auto w-full max-w-[760px] rounded-2xl border border-border bg-surface px-5 py-8 shadow-page sm:px-16 sm:py-16">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
