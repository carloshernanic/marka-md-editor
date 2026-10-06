# Marka

**[trymarka.dev](https://trymarka.dev)**

Editor de Markdown no navegador, uma mistura de Google Docs e Notion. Sem login: tudo fica salvo no `localStorage`.

## Funcionalidades

- **Importar** arquivos `.md` (botão, ou arrastar e soltar na janela)
- **Criar** documentos do zero, renomear, duplicar e excluir
- **Editar** com WYSIWYG (Tiptap/ProseMirror) e sincronização em Markdown
- **Slash commands** estilo Notion: digite `/` para títulos, listas, tarefas, citação, código, tabela, imagem e divisor
- **Toolbar** estilo Google Docs: desfazer/refazer, tipo de bloco, negrito, itálico, sublinhado, tachado, código, destaque, link, alinhamento, listas, tabela e imagem
- **Exportar** para PDF (impressão do navegador), DOCX (`docx`) e Markdown
- Tema claro e escuro, layout responsivo

## Atalhos

| Ação | Atalho |
| --- | --- |
| Exportar Markdown | Ctrl + S |
| Exportar PDF | Ctrl + P |
| Novo documento | Ctrl + Alt + N |
| Mostrar/ocultar painel | Ctrl + \ |
| Menu de blocos | `/` |

## Rodando

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, Tiptap 3 com `@tiptap/markdown`, `docx`, `lucide-react`.

## Licença

[MIT](LICENSE)


