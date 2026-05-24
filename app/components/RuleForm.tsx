"use client";

/**
 * 左ペイン：就業規則の入力フォーム。
 *
 * - 会社名 / 施行日
 * - 労働時間システム（選択すると数値フォームの初期値が自動で書き換わる）
 * - 始業 / 終業 / 休憩 / 休日（プリセットで自動入力・個別編集可）
 * - 勤務間インターバルの有無（ON で時間入力を表示）
 * - 定年制のタイプ
 */

import {
  INDUSTRY_PRESETS,
  RETIREMENT_OPTIONS,
  SPECIAL_CLAUSES,
  WORK_HOURS_PRESETS,
} from "../lib/presets";
import { formatDuration, workingMinutes } from "../lib/generateRules";
import type {
  IndustryId,
  RetirementType,
  SpecialClauseId,
  WorkHoursSystemId,
  WorkRulesData,
} from "../lib/types";

interface RuleFormProps {
  data: WorkRulesData;
  /** 単一フィールドの更新 */
  onChange: <K extends keyof WorkRulesData>(
    key: K,
    value: WorkRulesData[K],
  ) => void;
  /** 労働時間システム変更（プリセット一括反映） */
  onSystemChange: (id: WorkHoursSystemId) => void;
  /** 業種別プリセットの一括適用 */
  onApplyIndustry: (id: IndustryId) => void;
  /** 現在選択中の業種プリセット（該当ボタンを選択中の色で表示） */
  selectedIndustry: IndustryId | null;
}

/** フォーム内のセクション見出し */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold tracking-wide text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

/** ラベル付き入力行 */
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export default function RuleForm({
  data,
  onChange,
  onSystemChange,
  onApplyIndustry,
  selectedIndustry,
}: RuleFormProps) {
  const actual = formatDuration(
    workingMinutes(data.startTime, data.endTime, data.breakMinutes),
  );
  const selectedPreset = WORK_HOURS_PRESETS.find(
    (p) => p.id === data.workHoursSystem,
  );

  // フレックスタイム制の詳細（system が "flextime" のときだけ表示・編集）
  const isFlextime = data.workHoursSystem === "flextime";
  const flex = data.flextime;
  const setFlex = <K extends keyof typeof flex>(
    key: K,
    value: (typeof flex)[K],
  ) => {
    onChange("flextime", { ...flex, [key]: value });
  };

  // 特約条項のトグル（SPECIAL_CLAUSES の並び順を保って更新）
  const activeClauses = new Set(data.specialClauses);
  const toggleClause = (id: SpecialClauseId) => {
    const next = new Set(activeClauses);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(
      "specialClauses",
      SPECIAL_CLAUSES.filter((c) => next.has(c.id)).map((c) => c.id),
    );
  };

  return (
    <div className="space-y-5">
      {/* 業種別プリセット（クリックで一括適用） */}
      <Section title="業種別プリセット">
        <p className="text-xs text-slate-500">
          業界標準の組み合わせ（労働時間制・定年・特約条項）を一括設定します。適用後も各項目は手動で微調整できます。
        </p>
        <div className="grid gap-2">
          {INDUSTRY_PRESETS.map((ind) => {
            const isActive = selectedIndustry === ind.id;
            return (
              <button
                key={ind.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onApplyIndustry(ind.id)}
                className={`rounded-lg border px-3 py-2.5 text-left transition hover:border-indigo-400 hover:bg-indigo-50 ${
                  isActive
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-slate-300 bg-white"
                }`}
              >
                <span className="block text-sm font-semibold text-slate-800">
                  {ind.label}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {ind.description}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* 第1章 総則 */}
      <Section title="基本情報（総則）">
        <Field label="会社名">
          <input
            type="text"
            className={inputClass}
            value={data.companyName}
            placeholder="株式会社〇〇"
            onChange={(e) => onChange("companyName", e.target.value)}
          />
        </Field>
        <Field label="施行日">
          <input
            type="date"
            className={inputClass}
            value={data.effectiveDate}
            onChange={(e) => onChange("effectiveDate", e.target.value)}
          />
        </Field>
      </Section>

      {/* 労働時間 */}
      <Section title="労働時間、休憩及び休日">
        <Field
          label="労働時間システム"
          hint={selectedPreset?.description}
        >
          <select
            className={inputClass}
            value={data.workHoursSystem}
            onChange={(e) =>
              onSystemChange(e.target.value as WorkHoursSystemId)
            }
          >
            {WORK_HOURS_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="始業時刻">
            <input
              type="time"
              className={inputClass}
              value={data.startTime}
              onChange={(e) => onChange("startTime", e.target.value)}
            />
          </Field>
          <Field label="終業時刻">
            <input
              type="time"
              className={inputClass}
              value={data.endTime}
              onChange={(e) => onChange("endTime", e.target.value)}
            />
          </Field>
          <Field label="休憩時間（分）">
            <input
              type="number"
              min={0}
              step={5}
              className={inputClass}
              value={data.breakMinutes}
              onChange={(e) =>
                onChange("breakMinutes", Number(e.target.value) || 0)
              }
            />
          </Field>
          <Field label="週の所定労働時間（時間）">
            <input
              type="number"
              min={0}
              step={1}
              className={inputClass}
              value={data.weeklyHours}
              onChange={(e) =>
                onChange("weeklyHours", Number(e.target.value) || 0)
              }
            />
          </Field>
        </div>

        {/* 実働時間の自動計算バッジ */}
        <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
          <span className="font-semibold">1日の所定労働時間（自動計算）</span>
          <span className="rounded bg-white px-2 py-0.5 font-mono font-bold">
            {actual}
          </span>
        </div>

        <Field label="休日">
          <textarea
            rows={2}
            className={`${inputClass} resize-none`}
            value={data.holidays}
            onChange={(e) => onChange("holidays", e.target.value)}
          />
        </Field>

        {/* フレックスタイム選択時のみ表示される詳細設定 */}
        {isFlextime && (
          <div className="space-y-4 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-indigo-700">
              <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] text-white">
                フレックス
              </span>
              フレックスタイム制の詳細
            </p>

            <Field
              label="清算期間"
              hint="総労働時間を清算する期間。最長3ヶ月まで設定できます。"
            >
              <select
                className={inputClass}
                value={flex.settlementPeriod}
                onChange={(e) => setFlex("settlementPeriod", e.target.value)}
              >
                <option value="1ヶ月">1ヶ月</option>
                <option value="2ヶ月">2ヶ月</option>
                <option value="3ヶ月">3ヶ月</option>
              </select>
            </Field>

            {/* コアタイム有無 → ON のときだけ時刻入力が現れる */}
            <label className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5">
              <span className="text-sm font-medium text-slate-700">
                コアタイムを設ける
              </span>
              <input
                type="checkbox"
                className="h-5 w-5 accent-indigo-600"
                checked={flex.hasCoreTime}
                onChange={(e) => setFlex("hasCoreTime", e.target.checked)}
              />
            </label>

            {flex.hasCoreTime && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="コアタイム開始">
                  <input
                    type="time"
                    className={inputClass}
                    value={flex.coreStart}
                    onChange={(e) => setFlex("coreStart", e.target.value)}
                  />
                </Field>
                <Field label="コアタイム終了">
                  <input
                    type="time"
                    className={inputClass}
                    value={flex.coreEnd}
                    onChange={(e) => setFlex("coreEnd", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {/* フレキシブルタイム */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-600">
                フレキシブルタイム（始業帯）
              </span>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  className={inputClass}
                  value={flex.flexStartFrom}
                  onChange={(e) => setFlex("flexStartFrom", e.target.value)}
                />
                <input
                  type="time"
                  className={inputClass}
                  value={flex.flexStartTo}
                  onChange={(e) => setFlex("flexStartTo", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-600">
                フレキシブルタイム（終業帯）
              </span>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  className={inputClass}
                  value={flex.flexEndFrom}
                  onChange={(e) => setFlex("flexEndFrom", e.target.value)}
                />
                <input
                  type="time"
                  className={inputClass}
                  value={flex.flexEndTo}
                  onChange={(e) => setFlex("flexEndTo", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* 勤務間インターバル */}
      <Section title="勤務間インターバル">
        <label className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
          <span className="text-sm font-medium text-slate-700">
            勤務間インターバル制度を導入する
          </span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-indigo-600"
            checked={data.intervalEnabled}
            onChange={(e) => onChange("intervalEnabled", e.target.checked)}
          />
        </label>
        {data.intervalEnabled && (
          <Field
            label="インターバル時間（時間）"
            hint="勤務終了から次の勤務開始までに確保する休息時間。一般に9〜11時間。"
          >
            <input
              type="number"
              min={1}
              max={24}
              step={1}
              className={inputClass}
              value={data.intervalHours}
              onChange={(e) =>
                onChange("intervalHours", Number(e.target.value) || 0)
              }
            />
          </Field>
        )}
      </Section>

      {/* 特約条項（服務規律に挿入される追加条文） */}
      <Section title="特約条項（業種特有の追加条文）">
        <p className="text-xs text-slate-500">
          チェックした条文が「服務規律」の章に挿入されます。業種プリセットで自動設定され、ここで個別に追加・削除もできます。
        </p>
        <div className="space-y-2">
          {SPECIAL_CLAUSES.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
            >
              <span className="text-sm font-medium text-slate-700">
                {c.label}
              </span>
              <input
                type="checkbox"
                className="h-5 w-5 accent-indigo-600"
                checked={activeClauses.has(c.id)}
                onChange={() => toggleClause(c.id)}
              />
            </label>
          ))}
        </div>
      </Section>

      {/* 定年制 */}
      <Section title="定年、退職及び解雇">
        <Field label="定年制のタイプ">
          <select
            className={inputClass}
            value={data.retirementType}
            onChange={(e) =>
              onChange("retirementType", e.target.value as RetirementType)
            }
          >
            {RETIREMENT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <p className="text-xs text-slate-400">
          {
            RETIREMENT_OPTIONS.find((o) => o.id === data.retirementType)
              ?.description
          }
        </p>
      </Section>
    </div>
  );
}
