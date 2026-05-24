/**
 * 就業規則のMarkdownテキストを、構造化されたWordドキュメント（.docx）へ変換し
 * ブラウザでダウンロードさせる。
 *
 * generateRules() が出力するMarkdownの記法に1対1で対応する：
 *   # …    → 文書タイトル（中央寄せ・特大・太字）
 *   ## …   → 章タイトル（太字・大きめ）
 *   ### …  → 条見出し（太字・中）
 *   - …    → 箇条書き
 *   n. …   → 項（番号付き・ぶら下げインデント）
 *   ---    → 区切り線
 *   その他  → 本文（インデント付き）
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { saveAs } from "file-saver";

// 日本語本文向けの既定フォントと文字サイズ（size はハーフポイント）
const BASE_FONT = "Yu Mincho";
const SIZE_BODY = 21; // 10.5pt
const SIZE_ARTICLE = 24; // 12pt
const SIZE_CHAPTER = 28; // 14pt
const SIZE_TITLE = 36; // 18pt

/** **太字** 記法を解釈して TextRun の配列を返す */
function inlineRuns(
  text: string,
  opts: { bold?: boolean; size?: number } = {},
): TextRun[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== "");
  if (parts.length === 0) {
    return [new TextRun({ text: "", size: opts.size })];
  }
  return parts.map((part) => {
    const isBold = part.startsWith("**") && part.endsWith("**");
    return new TextRun({
      text: isBold ? part.slice(2, -2) : part,
      bold: isBold || opts.bold,
      size: opts.size,
    });
  });
}

/** 文書タイトル（# 行） */
function titleParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    children: inlineRuns(text, { bold: true, size: SIZE_TITLE }),
  });
}

/** 章タイトル（## 行） */
function chapterParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 140 },
    children: inlineRuns(text, { bold: true, size: SIZE_CHAPTER }),
  });
}

/** 条見出し（### 行） */
function articleParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: inlineRuns(text, { bold: true, size: SIZE_ARTICLE }),
  });
}

/** 箇条書き（- 行） */
function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: inlineRuns(text, { size: SIZE_BODY }),
  });
}

/** 本文・項（その他の行）。「n. 」で始まる項はぶら下げインデントにする。 */
function bodyParagraph(text: string): Paragraph {
  const isNumbered = /^\d+\.\s/.test(text);
  return new Paragraph({
    indent: isNumbered ? { left: 480, hanging: 240 } : { left: 240 },
    spacing: { after: 80 },
    children: inlineRuns(text, { size: SIZE_BODY }),
  });
}

/** 区切り線（--- 行） */
function dividerParagraph(): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: {
      bottom: {
        color: "BBBBBB",
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    children: [],
  });
}

/** Markdownテキストを Paragraph 配列へ変換 */
function markdownToParagraphs(markdown: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    if (line === "") continue;
    if (line === "---") {
      paragraphs.push(dividerParagraph());
    } else if (line.startsWith("### ")) {
      paragraphs.push(articleParagraph(line.slice(4)));
    } else if (line.startsWith("## ")) {
      paragraphs.push(chapterParagraph(line.slice(3)));
    } else if (line.startsWith("# ")) {
      paragraphs.push(titleParagraph(line.slice(2)));
    } else if (line.startsWith("- ")) {
      paragraphs.push(bulletParagraph(line.slice(2)));
    } else {
      paragraphs.push(bodyParagraph(line));
    }
  }
  return paragraphs;
}

/** Markdownテキストから docx の Blob を生成 */
export async function buildDocxBlob(markdown: string): Promise<Blob> {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: BASE_FONT, size: SIZE_BODY },
        },
      },
    },
    sections: [
      {
        properties: {
          // A4（210mm×297mm）
          page: { size: { width: 11906, height: 16838 } },
        },
        children: markdownToParagraphs(markdown),
      },
    ],
  });
  return Packer.toBlob(doc);
}

/** ファイル名に使えない文字を除去して「就業規則_{会社名}.docx」を返す */
export function buildFileName(companyName: string): string {
  const safe = (companyName.trim() || "会社名未入力").replace(
    /[\\/:*?"<>|]/g,
    "",
  );
  return `就業規則_${safe}.docx`;
}

/** Markdownから .docx を生成し、ブラウザでダウンロードさせる */
export async function downloadDocx(
  markdown: string,
  companyName: string,
): Promise<void> {
  const blob = await buildDocxBlob(markdown);
  saveAs(blob, buildFileName(companyName));
}
