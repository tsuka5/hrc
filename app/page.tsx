"use client";

/**
 * メイン画面：就業規則「型」作成アプリ。
 *
 * 左ペイン（RuleForm）の入力・選択が、右ペイン（RulePreview）の
 * 就業規則テキストにリアルタイムで連動する。
 * 上部ヘッダーの「Word形式でダウンロード」で、表示中の全文を .docx 出力する。
 */

import { useEffect, useMemo, useRef, useState } from "react";

import RuleForm from "./components/RuleForm";
import RulePreview from "./components/RulePreview";
import { generateRules } from "./lib/generateRules";
import {
  applyIndustryPreset,
  applyWorkHoursPreset,
  createInitialData,
  getIndustryPreset,
} from "./lib/presets";
import type {
  IndustryId,
  WorkHoursSystemId,
  WorkRulesData,
} from "./lib/types";

export default function Home() {
  const [data, setData] = useState<WorkRulesData>(createInitialData);
  // 最後に適用した業種プリセット（ボタンを選択中の色で維持するために記憶）
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryId | null>(
    null,
  );
  // 一時通知（トースト）。id を変えるたびにアニメーションを再生する。
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 左右ペインの境界（スプリッター）をドラッグして幅を変更する
  const rowRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(440);
  const [dragging, setDragging] = useState(false);
  // lg 以上（横並び）のときだけ幅指定とスプリッターを有効にする
  const [isWide, setIsWide] = useState(true);

  // 2 秒だけメッセージを表示して自動で消す
  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message });
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  };

  // アンマウント時にタイマーを掃除
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // 画面幅（lg ブレークポイント）を監視
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // ドラッグ中はポインタ移動で左ペイン幅を更新（最小・最大でクランプ）
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const rect = rowRef.current?.getBoundingClientRect();
      if (!rect) return;
      const min = 320;
      const max = rect.width - 360; // プレビュー側に最低限の幅を残す
      const next = e.clientX - rect.left;
      setLeftWidth(Math.max(min, Math.min(next, max)));
    };
    const onUp = () => setDragging(false);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging]);

  // 単一フィールドの更新
  const handleChange = <K extends keyof WorkRulesData>(
    key: K,
    value: WorkRulesData[K],
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  // 労働時間システム変更 → プリセット値を一括反映
  const handleSystemChange = (id: WorkHoursSystemId) => {
    setData((prev) => applyWorkHoursPreset(prev, id));
  };

  // 業種別プリセット → 労働時間制・定年・特約条項を一括反映＋トースト表示
  const handleApplyIndustry = (id: IndustryId) => {
    setData((prev) => applyIndustryPreset(prev, id));
    setSelectedIndustry(id);
    const preset = getIndustryPreset(id);
    if (preset) showToast(`「${preset.label}」のプリセットを設定しました`);
  };

  // フォーム変更に追従してプレビュー本文を再生成
  const markdown = useMemo(() => generateRules(data), [data]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 lg:h-screen lg:overflow-hidden">
      {/* ヘッダー */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            就業規則「型」ジェネレーター
          </h1>
          <p className="text-xs text-slate-500">
            厚生労働省モデル就業規則（令和7年12月版）ベース ／ 社労士向けプロトタイプ
          </p>
        </div>
        <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 sm:inline">
          PROTOTYPE
        </span>
      </header>

      {/* 2ペインレイアウト
          - 狭い画面：縦積みでページ全体がスクロール
          - lg 以上：左フォーム（幅可変）・右プレビューがそれぞれ独立スクロール。
            中央のスプリッターをドラッグして境界を移動できる。 */}
      <div ref={rowRef} className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        {/* 左：入力フォーム */}
        <div
          className="border-slate-200 p-5 lg:flex-none lg:overflow-y-auto lg:border-r"
          style={isWide ? { width: leftWidth } : undefined}
        >
          <RuleForm
            data={data}
            onChange={handleChange}
            onSystemChange={handleSystemChange}
            onApplyIndustry={handleApplyIndustry}
            selectedIndustry={selectedIndustry}
          />
        </div>

        {/* スプリッター（lg 以上でのみ表示。ドラッグで左右の境界を移動） */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="入力欄とプレビューの境界をドラッグして幅を変更"
          onPointerDown={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDoubleClick={() => setLeftWidth(440)}
          title="ドラッグで幅を変更（ダブルクリックで既定値に戻す）"
          className={`hidden w-1.5 shrink-0 cursor-col-resize touch-none items-center justify-center transition-colors lg:flex ${
            dragging ? "bg-indigo-400" : "bg-slate-200 hover:bg-indigo-300"
          }`}
        >
          <span className="h-8 w-0.5 rounded-full bg-slate-400/70" />
        </div>

        {/* 右：プレビュー */}
        <div className="lg:min-h-0 lg:flex-1">
          <RulePreview markdown={markdown} companyName={data.companyName} />
        </div>
      </div>

      {/* 一時通知トースト（業種プリセット適用時などに一瞬表示） */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className="toast-anim flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-emerald-400"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.2 7.3a1 1 0 0 1-1.42.006l-3.8-3.78a1 1 0 1 1 1.41-1.418l3.09 3.073 6.49-6.58a1 1 0 0 1 1.414-.005Z"
                clipRule="evenodd"
              />
            </svg>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
