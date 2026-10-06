import type { JSONContent } from "@tiptap/core";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IParagraphOptions,
  type IRunOptions,
  type ParagraphChild,
} from "docx";

type Block = Paragraph | Table;

const FONT = "Calibri";
const MONO = "Consolas";
const CODE_BG = "F4F4F5";
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "D4D4D8" } as const;

type Ctx = {
  numberingInstance: number;
  images: Map<string, ImageInfo>;
};

type Opts = {
  /** Nesting level for lists / indentation. */
  level?: number;
  /** Extra paragraph options merged into every paragraph produced. */
  para?: Partial<IParagraphOptions>;
  /** Extra run options merged into every text run produced. */
  run?: Partial<IRunOptions>;
};

type ImageInfo = {
  type: "png" | "jpg" | "gif" | "bmp";
  data: Uint8Array;
  width: number;
  height: number;
};

const HEADINGS = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
} as const;

function alignment(attrs?: Record<string, unknown>) {
  switch (attrs?.textAlign) {
    case "center":
      return AlignmentType.CENTER;
    case "right":
      return AlignmentType.RIGHT;
    case "justify":
      return AlignmentType.JUSTIFIED;
    default:
      return undefined;
  }
}

function runOptionsFromMarks(marks: JSONContent["marks"] = []): Partial<IRunOptions> {
  const o: { -readonly [K in keyof IRunOptions]?: IRunOptions[K] } = {};
  for (const m of marks) {
    switch (m.type) {
      case "bold":
        o.bold = true;
        break;
      case "italic":
        o.italics = true;
        break;
      case "underline":
        o.underline = {};
        break;
      case "strike":
        o.strike = true;
        break;
      case "code":
        o.font = MONO;
        o.shading = { type: ShadingType.CLEAR, fill: CODE_BG, color: "auto" };
        break;
      case "highlight":
        o.highlight = "yellow";
        break;
      case "subscript":
        o.subScript = true;
        break;
      case "superscript":
        o.superScript = true;
        break;
    }
  }
  return o;
}

function inlineChildren(
  nodes: JSONContent[] = [],
  ctx: Ctx,
  extra: Partial<IRunOptions> = {},
): ParagraphChild[] {
  const out: ParagraphChild[] = [];
  for (const n of nodes) {
    if (n.type === "text") {
      const link = n.marks?.find((m) => m.type === "link");
      const opts = { ...extra, ...runOptionsFromMarks(n.marks) };
      if (link?.attrs?.href) {
        out.push(
          new ExternalHyperlink({
            link: String(link.attrs.href),
            children: [new TextRun({ text: n.text ?? "", style: "Hyperlink", ...opts })],
          }),
        );
      } else {
        out.push(new TextRun({ text: n.text ?? "", ...opts }));
      }
    } else if (n.type === "hardBreak") {
      out.push(new TextRun({ break: 1 }));
    } else if (n.type === "image") {
      const src = String(n.attrs?.src ?? "");
      const img = ctx.images.get(src);
      if (img) {
        out.push(
          new ImageRun({
            type: img.type,
            data: img.data,
            transformation: { width: img.width, height: img.height },
            altText: {
              name: "image",
              description: String(n.attrs?.alt ?? ""),
              title: String(n.attrs?.title ?? ""),
            },
          }),
        );
      } else if (src) {
        out.push(
          new ExternalHyperlink({
            link: src,
            children: [new TextRun({ text: String(n.attrs?.alt || src), style: "Hyperlink" })],
          }),
        );
      }
    } else if (n.content) {
      out.push(...inlineChildren(n.content, ctx, extra));
    }
  }
  return out;
}

function plainText(node: JSONContent): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  return (node.content ?? []).map(plainText).join("");
}

function blocks(nodes: JSONContent[] = [], ctx: Ctx, opts: Opts = {}): Block[] {
  const out: Block[] = [];
  for (const node of nodes) out.push(...block(node, ctx, opts));
  return out;
}

function block(node: JSONContent, ctx: Ctx, opts: Opts = {}): Block[] {
  const level = opts.level ?? 0;
  const indent = level ? { left: 720 * level } : undefined;
  const para = opts.para ?? {};
  const run = opts.run ?? {};

  switch (node.type) {
    case "paragraph": {
      const onlyImage = node.content?.length === 1 && node.content[0].type === "image";
      return [
        new Paragraph({
          alignment: onlyImage ? AlignmentType.CENTER : alignment(node.attrs),
          indent,
          spacing: { after: 160, line: 320 },
          ...para,
          children: inlineChildren(node.content, ctx, run),
        }),
      ];
    }
    case "heading": {
      const lvl = Math.min(6, Math.max(1, Number(node.attrs?.level ?? 1))) as keyof typeof HEADINGS;
      return [
        new Paragraph({
          alignment: alignment(node.attrs),
          heading: HEADINGS[lvl],
          indent,
          spacing: { before: lvl === 1 ? 360 : 280, after: 120 },
          ...para,
          children: inlineChildren(node.content, ctx, run),
        }),
      ];
    }
    case "bulletList":
    case "orderedList":
    case "taskList": {
      const isOrdered = node.type === "orderedList";
      const isTask = node.type === "taskList";
      const instance = isOrdered ? ++ctx.numberingInstance : 0;
      const out: Block[] = [];
      for (const item of node.content ?? []) {
        const [first, ...rest] = item.content ?? [];
        const checked = item.attrs?.checked === true;
        if (first && first.type === "paragraph") {
          const children = inlineChildren(
            first.content,
            ctx,
            isTask && checked ? { ...run, strike: true, color: "9CA3AF" } : run,
          );
          if (isTask) children.unshift(new TextRun({ text: checked ? "☑  " : "☐  ", ...run }));
          out.push(
            new Paragraph({
              numbering: isTask
                ? undefined
                : { reference: isOrdered ? "numbers" : "bullets", level: Math.min(level, 8), instance },
              indent: isTask ? { left: 360 + 720 * level } : undefined,
              spacing: { after: 60, line: 320 },
              ...para,
              children,
            }),
          );
        } else if (first) {
          out.push(...block(first, ctx, { ...opts, level: level + 1 }));
        }
        for (const child of rest) out.push(...block(child, ctx, { ...opts, level: level + 1 }));
      }
      return out;
    }
    case "blockquote":
      return blocks(node.content, ctx, {
        ...opts,
        para: {
          ...para,
          indent: { left: 720 * (level + 1) },
          border: { left: { style: BorderStyle.SINGLE, size: 18, color: "D4D4D8", space: 12 } },
        },
        run: { ...run, color: "52525B" },
      });
    case "codeBlock": {
      const lines = plainText(node).split("\n");
      return [
        new Paragraph({
          children: lines.flatMap((line, i) => [
            ...(i > 0 ? [new TextRun({ break: 1 })] : []),
            new TextRun({ text: line, font: MONO, size: 19 }),
          ]),
          shading: { type: ShadingType.CLEAR, fill: CODE_BG, color: "auto" },
          border: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
          indent,
          spacing: { before: 120, after: 200, line: 300 },
        }),
      ];
    }
    case "horizontalRule":
      return [
        new Paragraph({
          children: [],
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "D4D4D8", space: 1 } },
          spacing: { before: 240, after: 240 },
        }),
      ];
    case "table": {
      const rows = (node.content ?? []).map((row) => {
        const cells = (row.content ?? []).map((cell) => {
          const isHeader = cell.type === "tableHeader";
          const content = blocks(cell.content, ctx, {
            para: { spacing: { after: 0, line: 280 } },
            run: isHeader ? { bold: true } : {},
          }).filter((c): c is Paragraph => c instanceof Paragraph);
          return new TableCell({
            children: content.length ? content : [new Paragraph({ children: [new TextRun("")] })],
            shading: isHeader ? { type: ShadingType.CLEAR, fill: "FAFAFA", color: "auto" } : undefined,
            columnSpan: Number(cell.attrs?.colspan ?? 1) || 1,
            rowSpan: Number(cell.attrs?.rowspan ?? 1) || 1,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
          });
        });
        return new TableRow({
          children: cells,
          tableHeader: row.content?.[0]?.type === "tableHeader",
        });
      });
      return [
        new Table({
          rows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: BORDER,
            bottom: BORDER,
            left: BORDER,
            right: BORDER,
            insideHorizontal: BORDER,
            insideVertical: BORDER,
          },
        }),
        new Paragraph({ children: [], spacing: { after: 120 } }),
      ];
    }
    case "image":
      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: inlineChildren([node], ctx),
          spacing: { before: 120, after: 160 },
        }),
      ];
    default:
      if (node.content) return blocks(node.content, ctx, opts);
      return [];
  }
}

function collectImageSources(node: JSONContent, acc: Set<string>) {
  if (node.type === "image" && node.attrs?.src) acc.add(String(node.attrs.src));
  node.content?.forEach((c) => collectImageSources(c, acc));
}

async function loadImage(src: string): Promise<ImageInfo | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    const mime = blob.type;
    let type: ImageInfo["type"] | null = null;
    if (mime.includes("png")) type = "png";
    else if (mime.includes("jpeg") || mime.includes("jpg")) type = "jpg";
    else if (mime.includes("gif")) type = "gif";
    else if (mime.includes("bmp")) type = "bmp";
    if (!type) return null;
    const data = new Uint8Array(await blob.arrayBuffer());
    const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = url;
    });
    const maxW = 600;
    const scale = dims.w > maxW ? maxW / dims.w : 1;
    return { type, data, width: Math.round(dims.w * scale), height: Math.round(dims.h * scale) };
  } catch {
    return null;
  }
}

export async function exportDocx(json: JSONContent, title: string): Promise<Blob> {
  const sources = new Set<string>();
  collectImageSources(json, sources);
  const images = new Map<string, ImageInfo>();
  await Promise.all(
    Array.from(sources).map(async (src) => {
      const info = await loadImage(src);
      if (info) images.set(src, info);
    }),
  );

  const ctx: Ctx = { numberingInstance: 0, images };
  const children = blocks(json.content, ctx);

  const bulletLevels = Array.from({ length: 9 }, (_, i) => ({
    level: i,
    format: LevelFormat.BULLET,
    text: ["•", "◦", "▪"][i % 3],
    alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 720 * (i + 1), hanging: 360 } } },
  }));
  const numberLevels = Array.from({ length: 9 }, (_, i) => ({
    level: i,
    format: [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN][i % 3],
    text: `%${i + 1}.`,
    alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 720 * (i + 1), hanging: 360 } } },
  }));

  const heading = (id: string, name: string, size: number, italics = false) => ({
    id,
    name,
    basedOn: "Normal",
    next: "Normal",
    quickFormat: true,
    run: { size, bold: true, italics, color: "0A0A0A", font: FONT },
  });

  const doc = new Document({
    title,
    creator: "Marka",
    styles: {
      default: {
        document: { run: { font: FONT, size: 22, color: "111111" } },
      },
      paragraphStyles: [
        heading("Heading1", "Heading 1", 44),
        heading("Heading2", "Heading 2", 34),
        heading("Heading3", "Heading 3", 28),
        heading("Heading4", "Heading 4", 24),
        heading("Heading5", "Heading 5", 22),
        heading("Heading6", "Heading 6", 22, true),
      ],
      characterStyles: [{ id: "Hyperlink", name: "Hyperlink", run: { color: "0A84FF", underline: {} } }],
    },
    numbering: {
      config: [
        { reference: "bullets", levels: bulletLevels },
        { reference: "numbers", levels: numberLevels },
      ],
    },
    sections: [
      {
        properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
        children: children.length ? children : [new Paragraph({ children: [new TextRun("")] })],
      },
    ],
  });

  return Packer.toBlob(doc);
}
