import type { Editor, Range } from "@tiptap/core";
import {
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Table,
  type LucideIcon,
} from "lucide-react";

export type SlashItem = {
  title: string;
  description: string;
  keywords: string[];
  icon: LucideIcon;
  group: "Básico" | "Listas" | "Blocos";
  command: (props: { editor: Editor; range: Range }) => void;
};

export const SLASH_ITEMS: SlashItem[] = [
  {
    title: "Texto",
    description: "Comece a escrever com texto simples.",
    keywords: ["texto", "paragrafo", "p", "text"],
    icon: Pilcrow,
    group: "Básico",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: "Título 1",
    description: "Título de seção grande.",
    keywords: ["h1", "titulo", "heading", "#"],
    icon: Heading1,
    group: "Básico",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  {
    title: "Título 2",
    description: "Título de seção médio.",
    keywords: ["h2", "titulo", "heading", "##"],
    icon: Heading2,
    group: "Básico",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    title: "Título 3",
    description: "Título de seção pequeno.",
    keywords: ["h3", "titulo", "heading", "###"],
    icon: Heading3,
    group: "Básico",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    title: "Lista com marcadores",
    description: "Crie uma lista simples.",
    keywords: ["lista", "bullet", "ul", "-"],
    icon: List,
    group: "Listas",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Lista numerada",
    description: "Crie uma lista com números.",
    keywords: ["lista", "numerada", "ordered", "ol", "1."],
    icon: ListOrdered,
    group: "Listas",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Lista de tarefas",
    description: "Acompanhe tarefas com checkboxes.",
    keywords: ["tarefa", "todo", "task", "checkbox", "[]"],
    icon: CheckSquare,
    group: "Listas",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: "Citação",
    description: "Destaque uma citação.",
    keywords: ["citacao", "quote", "blockquote", ">"],
    icon: Quote,
    group: "Blocos",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Código",
    description: "Bloco de código com fonte mono.",
    keywords: ["codigo", "code", "pre", "```"],
    icon: Code,
    group: "Blocos",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Tabela",
    description: "Insira uma tabela 3 × 3.",
    keywords: ["tabela", "table", "grid"],
    icon: Table,
    group: "Blocos",
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    title: "Imagem",
    description: "Insira uma imagem por URL.",
    keywords: ["imagem", "image", "img", "foto", "picture"],
    icon: ImageIcon,
    group: "Blocos",
    command: ({ editor, range }) => {
      const url = window.prompt("URL da imagem");
      const chain = editor.chain().focus().deleteRange(range);
      if (url) chain.setImage({ src: url }).run();
      else chain.run();
    },
  },
  {
    title: "Divisor",
    description: "Separe seções com uma linha.",
    keywords: ["divisor", "hr", "linha", "separador", "---"],
    icon: Minus,
    group: "Blocos",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
];

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function filterSlashItems(query: string): SlashItem[] {
  const q = normalize(query.trim());
  if (!q) return SLASH_ITEMS;
  return SLASH_ITEMS.filter(
    (item) =>
      normalize(item.title).includes(q) ||
      item.keywords.some((k) => normalize(k).includes(q)),
  );
}
