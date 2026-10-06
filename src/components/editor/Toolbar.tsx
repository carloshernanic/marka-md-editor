"use client";

import { type Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  ChevronDown,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { Menu, MenuItem } from "@/components/ui/Menu";
import type { ReactNode } from "react";

type Props = { editor: Editor };

function TBtn({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-lg transition-colors disabled:opacity-30 ${
        active
          ? "bg-fg text-accent-fg dark:bg-fg dark:text-accent-fg"
          : "text-fg-muted hover:bg-fg/[0.06] hover:text-fg dark:hover:bg-fg/[0.08]"
      }`}
    >
      <Icon size={16} strokeWidth={1.9} />
    </button>
  );
}

function Sep() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-border-strong" />;
}

function Group({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 items-center gap-0.5">{children}</div>;
}

export function Toolbar({ editor }: Props) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null;
      return {
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        strike: e.isActive("strike"),
        code: e.isActive("code"),
        highlight: e.isActive("highlight"),
        link: e.isActive("link"),
        h1: e.isActive("heading", { level: 1 }),
        h2: e.isActive("heading", { level: 2 }),
        h3: e.isActive("heading", { level: 3 }),
        paragraph: e.isActive("paragraph"),
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
        taskList: e.isActive("taskList"),
        blockquote: e.isActive("blockquote"),
        codeBlock: e.isActive("codeBlock"),
        table: e.isActive("table"),
        alignLeft: e.isActive({ textAlign: "left" }),
        alignCenter: e.isActive({ textAlign: "center" }),
        alignRight: e.isActive({ textAlign: "right" }),
        alignJustify: e.isActive({ textAlign: "justify" }),
      };
    },
  });

  if (!editor || !s) return <div className="h-12" />;

  const blockLabel = s.h1
    ? "Título 1"
    : s.h2
      ? "Título 2"
      : s.h3
        ? "Título 3"
        : s.codeBlock
          ? "Código"
          : s.blockquote
            ? "Citação"
            : "Texto";

  const BlockIcon = s.h1 ? Heading1 : s.h2 ? Heading2 : s.h3 ? Heading3 : s.codeBlock ? Code2 : s.blockquote ? Quote : Pilcrow;

  const AlignIcon = s.alignCenter ? AlignCenter : s.alignRight ? AlignRight : s.alignJustify ? AlignJustify : AlignLeft;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const addImage = () => {
    const url = window.prompt("URL da imagem");
    if (url) editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  return (
    <div className="no-print flex h-12 items-center gap-0.5 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Group>
        <TBtn icon={Undo2} label="Desfazer (Ctrl+Z)" disabled={!s.canUndo} onClick={() => editor.chain().focus().undo().run()} />
        <TBtn icon={Redo2} label="Refazer (Ctrl+Shift+Z)" disabled={!s.canRedo} onClick={() => editor.chain().focus().redo().run()} />
      </Group>

      <Sep />

      <Menu
        trigger={({ toggle }) => (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggle}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm text-fg hover:bg-fg/[0.06] dark:hover:bg-fg/[0.08]"
          >
            <BlockIcon size={15} strokeWidth={1.9} className="text-fg-muted" />
            <span className="w-16 truncate text-left">{blockLabel}</span>
            <ChevronDown size={14} className="text-fg-faint" />
          </button>
        )}
      >
        {(close) => (
          <>
            <MenuItem icon={<Pilcrow size={15} />} label="Texto" hint="Ctrl+Alt+0" active={s.paragraph && !s.blockquote} onClick={() => { editor.chain().focus().setParagraph().run(); close(); }} />
            <MenuItem icon={<Heading1 size={15} />} label="Título 1" hint="Ctrl+Alt+1" active={s.h1} onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); close(); }} />
            <MenuItem icon={<Heading2 size={15} />} label="Título 2" hint="Ctrl+Alt+2" active={s.h2} onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); close(); }} />
            <MenuItem icon={<Heading3 size={15} />} label="Título 3" hint="Ctrl+Alt+3" active={s.h3} onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); close(); }} />
            <MenuItem icon={<Quote size={15} />} label="Citação" active={s.blockquote} onClick={() => { editor.chain().focus().toggleBlockquote().run(); close(); }} />
            <MenuItem icon={<Code2 size={15} />} label="Código" active={s.codeBlock} onClick={() => { editor.chain().focus().toggleCodeBlock().run(); close(); }} />
          </>
        )}
      </Menu>

      <Sep />

      <Group>
        <TBtn icon={Bold} label="Negrito (Ctrl+B)" active={s.bold} onClick={() => editor.chain().focus().toggleBold().run()} />
        <TBtn icon={Italic} label="Itálico (Ctrl+I)" active={s.italic} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <TBtn icon={Underline} label="Sublinhado (Ctrl+U)" active={s.underline} onClick={() => editor.chain().focus().toggleUnderline().run()} />
        <TBtn icon={Strikethrough} label="Tachado" active={s.strike} onClick={() => editor.chain().focus().toggleStrike().run()} />
        <TBtn icon={Code} label="Código inline (Ctrl+E)" active={s.code} onClick={() => editor.chain().focus().toggleCode().run()} />
        <TBtn icon={Highlighter} label="Destacar" active={s.highlight} onClick={() => editor.chain().focus().toggleHighlight().run()} />
        <TBtn icon={LinkIcon} label="Link (Ctrl+K)" active={s.link} onClick={setLink} />
      </Group>

      <Sep />

      <Menu
        trigger={({ toggle }) => (
          <button
            type="button"
            title="Alinhamento"
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggle}
            className="flex h-8 items-center gap-1 rounded-lg px-1.5 text-fg-muted hover:bg-fg/[0.06] hover:text-fg dark:hover:bg-fg/[0.08]"
          >
            <AlignIcon size={16} strokeWidth={1.9} />
            <ChevronDown size={13} className="text-fg-faint" />
          </button>
        )}
      >
        {(close) => (
          <>
            <MenuItem icon={<AlignLeft size={15} />} label="Esquerda" active={s.alignLeft} onClick={() => { editor.chain().focus().setTextAlign("left").run(); close(); }} />
            <MenuItem icon={<AlignCenter size={15} />} label="Centro" active={s.alignCenter} onClick={() => { editor.chain().focus().setTextAlign("center").run(); close(); }} />
            <MenuItem icon={<AlignRight size={15} />} label="Direita" active={s.alignRight} onClick={() => { editor.chain().focus().setTextAlign("right").run(); close(); }} />
            <MenuItem icon={<AlignJustify size={15} />} label="Justificado" active={s.alignJustify} onClick={() => { editor.chain().focus().setTextAlign("justify").run(); close(); }} />
          </>
        )}
      </Menu>

      <Sep />

      <Group>
        <TBtn icon={List} label="Lista com marcadores" active={s.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <TBtn icon={ListOrdered} label="Lista numerada" active={s.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <TBtn icon={CheckSquare} label="Lista de tarefas" active={s.taskList} onClick={() => editor.chain().focus().toggleTaskList().run()} />
      </Group>

      <Sep />

      <Group>
        <TBtn icon={Quote} label="Citação" active={s.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <TBtn icon={Code2} label="Bloco de código" active={s.codeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
        <TBtn icon={Minus} label="Divisor" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
        <TBtn icon={ImageIcon} label="Imagem" onClick={addImage} />
        {s.table ? (
          <Menu
            trigger={({ toggle }) => (
              <button
                type="button"
                title="Tabela"
                onMouseDown={(e) => e.preventDefault()}
                onClick={toggle}
                className="flex h-8 items-center gap-1 rounded-lg bg-fg px-1.5 text-accent-fg"
              >
                <TableIcon size={16} strokeWidth={1.9} />
                <ChevronDown size={13} />
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuItem label="Adicionar linha abaixo" onClick={() => { editor.chain().focus().addRowAfter().run(); close(); }} />
                <MenuItem label="Adicionar linha acima" onClick={() => { editor.chain().focus().addRowBefore().run(); close(); }} />
                <MenuItem label="Adicionar coluna à direita" onClick={() => { editor.chain().focus().addColumnAfter().run(); close(); }} />
                <MenuItem label="Adicionar coluna à esquerda" onClick={() => { editor.chain().focus().addColumnBefore().run(); close(); }} />
                <MenuItem label="Alternar linha de cabeçalho" onClick={() => { editor.chain().focus().toggleHeaderRow().run(); close(); }} />
                <MenuItem label="Remover linha" onClick={() => { editor.chain().focus().deleteRow().run(); close(); }} />
                <MenuItem label="Remover coluna" onClick={() => { editor.chain().focus().deleteColumn().run(); close(); }} />
                <MenuItem label="Remover tabela" danger onClick={() => { editor.chain().focus().deleteTable().run(); close(); }} />
              </>
            )}
          </Menu>
        ) : (
          <TBtn
            icon={TableIcon}
            label="Tabela"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          />
        )}
      </Group>
    </div>
  );
}
