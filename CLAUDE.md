# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Marka: editor de Markdown no navegador (Google Docs + Notion), sem login. Next.js 16 (App Router, Turbopack, `cacheComponents`), React 19, Tailwind CSS 4, Tiptap 3. Interface e mensagens de commit em português.

## Comandos

```bash
npm run dev          # http://localhost:3000
npm run build        # também roda a checagem de tipos
npm run lint         # eslint (next/core-web-vitals + typescript + react-hooks do React Compiler)
npx tsc --noEmit     # só tipos
```

Não há suite de testes. A verificação feita até agora foi manual com Playwright headless (Python) contra o `dev server`: abrir a página, usar slash menu/toolbar, importar `.md`, exportar e inspecionar o `localStorage` em `marka:docs`.

Commits: Conventional Commits em português (`feat:`, `fix:`, `build(deps):`, `docs:`), um commit por unidade lógica, sem linha `Co-Authored-By`.

## Arquitetura

**Fonte da verdade é Markdown.** Cada documento (`src/lib/types.ts`) guarda `content` como string Markdown. O editor Tiptap converte Markdown ⇄ ProseMirror via `@tiptap/markdown` (`contentType: "markdown"` no `useEditor`/`setContent`, `editor.getMarkdown()` na saída). Qualquer nova extensão de nó/marca precisa ter serialização Markdown, senão o conteúdo some ao salvar.

**Estado global sem contexto React.** `src/hooks/useDocuments.ts` é um store de módulo exposto por `useSyncExternalStore`, persistido em `localStorage` (`marka:docs`, `marka:active`) com debounce de 250 ms e flush em `beforeunload`. O snapshot de servidor é `{ ready: false }`, então `App` renderiza um spinner no SSR e só monta a UI real no cliente; isso é o que evita mismatch de hidratação, e por isso estado inicial dependente de `window` (ex.: sidebar fechada no mobile) é seguro em `useState` lazy. O tema (`useTheme.ts`) segue o mesmo padrão lendo a classe `dark` do `<html>`, aplicada antes da hidratação por um script inline em `layout.tsx`.

O lint usa as regras do React Compiler: `setState` síncrono dentro de `useEffect` falha. Use `useSyncExternalStore`, estado derivado durante o render (padrão em `TopBar.tsx`) ou `useState` lazy.

**Fluxo de edição.** `App` → `Editor` (recebe `doc`, emite `onChange(id, markdown)` com debounce de 300 ms e expõe a instância via `onEditor` para exportação). Ao trocar de documento, `Editor` chama `setContent(..., { emitUpdate: false })` e faz flush de edições pendentes do documento anterior. O título segue o primeiro `#` do conteúdo até o usuário renomear manualmente (`manualTitle`).

**Slash commands.** `editor/slash-command.ts` usa `@tiptap/suggestion` com `props.mount()` (posicionamento gerenciado por Floating UI) e `ReactRenderer` para montar `SlashMenu`. Os itens ficam em `slash-items.ts`; adicionar um bloco novo é adicionar uma entrada lá (título, keywords, ícone lucide, grupo, comando).

**Toolbar.** `editor/Toolbar.tsx` lê o estado com `useEditorState` e só é montada quando `editor` existe (senão o estado inicial não é calculado). Dropdowns usam `components/ui/Menu.tsx`.

**Exportação** (`src/lib/`):
- PDF: `window.print()` com o bloco `@media print` em `globals.css`, que esconde `.no-print`, remove a moldura da `.page` e força tokens claros mesmo em tema escuro.
- DOCX: `export-docx.ts` percorre `editor.getJSON()` recursivamente; opções de parágrafo/run são passadas por `Opts` (blockquote, cabeçalho de tabela) porque `Paragraph` do `docx` não expõe suas opções depois de criado. Listas ordenadas usam `numbering.instance` incremental para reiniciar a contagem. É carregado com `import()` dinâmico.
- Markdown: `editor.getMarkdown()` direto.

**Design tokens.** Tudo em `globals.css`: variáveis CSS em `:root`/`.dark` mapeadas para Tailwind via `@theme inline` (`bg-surface`, `text-fg-muted`, `border-border`, `shadow-page`…). Dark mode é por classe (`@custom-variant dark`). Tipografia do editor fica em `.tiptap`.
