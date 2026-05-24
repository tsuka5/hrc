"use client";

/**
 * 右ペイン：就業規則プレビュー。
 *
 * generateRules() が返すMarkdownテキストを、依存ライブラリなしの
 * 軽量レンダラーで「文書らしく」表示する。見出し・水平線・箇条書き・
 * 番号付き行・太字（**）に対応する。
 */

import { useMemo, useState } from "react";

import { downloadDocx } from "../lib/exportDocx";

interface RulePreviewProps {
  /** Markdownテキスト全文 */
  markdown: string;
  /** ダウンロードファイル名に使う会社名 */
  companyName: string;
}

/** **bold** を <strong> に変換したインライン要素を返す */
function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

/** Markdownテキストを React 要素配列へ変換する軽量レンダラー */
function renderMarkdown(md: string): React.ReactNode[] {
  const blocks: React.ReactNode[] = [];
  const lines = md.split("\n");
  let listBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    const items = [...listBuffer];
    blocks.push(
      <ul
        key={`ul-${key++}`}
        className="my-2 ml-5 list-disc space-y-1 text-slate-700"
      >
        {items.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith("- ")) {
      listBuffer.push(trimmed.slice(2));
      continue;
    }
    flushList();

    if (trimmed === "") {
      continue;
    }
    if (trimmed === "---") {
      blocks.push(<hr key={`hr-${key++}`} className="my-6 border-slate-200" />);
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(
        <h3
          key={`h3-${key++}`}
          className="mt-5 mb-1 text-base font-bold text-slate-900"
        >
          {renderInline(line.slice(4))}
        </h3>,
      );
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h2
          key={`h2-${key++}`}
          className="mt-7 mb-2 border-b border-slate-300 pb-1 text-lg font-bold text-slate-900"
        >
          {renderInline(line.slice(3))}
        </h2>,
      );
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(
        <h1
          key={`h1-${key++}`}
          className="mb-4 text-center text-2xl font-bold tracking-wide text-slate-900"
        >
          {renderInline(line.slice(2))}
        </h1>,
      );
      continue;
    }
    // 通常段落（番号付き行「1. …」もここで番号付きのまま表示）
    blocks.push(
      <p key={`p-${key++}`} className="my-1 leading-relaxed text-slate-700">
        {renderInline(line)}
      </p>,
    );
  }
  flushList();

  return blocks;
}

export default function RulePreview({
  markdown,
  companyName,
}: RulePreviewProps) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const rendered = useMemo(() => renderMarkdown(markdown), [markdown]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadWord = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await downloadDocx(markdown, companyName);
    } catch (e) {
      console.error("Word出力に失敗しました", e);
      alert("Wordファイルの生成に失敗しました。");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col lg:h-full">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-200 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-bold text-slate-700">
            就業規則プレビュー
          </span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            リアルタイム連動
          </span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {copied ? "コピーしました ✓" : "Markdownをコピー"}
          </button>
          <button
            type="button"
            onClick={handleDownloadWord}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path d="M10 1.5a.75.75 0 0 1 .75.75v8.69l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 0 1 1.06-1.06l2.72 2.72V2.25A.75.75 0 0 1 10 1.5Z" />
              <path d="M3.5 13.5a.75.75 0 0 1 .75.75v1.5c0 .14.11.25.25.25h11a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 15.5 17.5h-11A1.75 1.75 0 0 1 2.75 15.75v-1.5a.75.75 0 0 1 .75-.75Z" />
            </svg>
            {exporting ? "生成中…" : "Word形式でダウンロード"}
          </button>
        </div>
      </div>
      <div className="flex-1 bg-slate-100 p-6 lg:overflow-y-auto">
        <article className="mx-auto max-w-2xl rounded-lg bg-white px-8 py-10 text-sm shadow-md">
          {rendered}
        </article>
      </div>
    </div>
  );
}
