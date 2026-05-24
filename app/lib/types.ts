/**
 * 就業規則「型」作成アプリ — データ構造の型定義
 *
 * 厚生労働省「モデル就業規則」（令和7年12月版）の構成をベースに、
 * フォーム入力・条件分岐でプレビューを生成するために必要な項目を定義する。
 */

/** 労働時間システムの種類 */
export type WorkHoursSystemId =
  /** 完全週休2日制（1日8時間・週40時間） */
  | "fullTwoDayOff8h"
  /** 1ヶ月単位の変形労働時間制（1日7時間15分 等） */
  | "monthlyVariable715"
  /** 1年単位の変形労働時間制 */
  | "yearlyVariable"
  /** フレックスタイム制 */
  | "flextime"
  /** 専門業務型裁量労働制（みなし労働時間） */
  | "discretionary";

/** 定年制のタイプ */
export type RetirementType =
  /** 定年を定めない */
  | "none"
  /** 60歳定年＋65歳までの継続雇用 */
  | "age60Continue65"
  /** 65歳定年 */
  | "age65"
  /** 65歳定年＋70歳までの就業確保措置 */
  | "age65Measure70"
  /** 70歳定年 */
  | "age70";

/** 業種別プリセットの種類 */
export type IndustryId =
  /** 一般オフィス（製造・事務） */
  | "office"
  /** 飲食・小売・サービス業 */
  | "foodRetail"
  /** IT・クリエイティブ業 */
  | "itCreative";

/** 業種特有の追加条文（服務規律の章に挿入される特約条項）の種類 */
export type SpecialClauseId =
  /** 衛生管理・検便の義務化（飲食） */
  | "hygieneInspection"
  /** SNS利用規律・バイトテロ防止（飲食・小売） */
  | "snsConduct"
  /** 厳格な秘密保持義務・BYOD制限（IT） */
  | "strictConfidentiality"
  /** 職務発明・知的財産権の帰属（IT） */
  | "inventionAssignment"
  /** 副業・兼業の許可制（IT） */
  | "sideJobApproval";

/**
 * 労働時間システムのプリセット。
 * フォームでシステムを選択すると、ここで定義した初期値が
 * 数値フォーム（始業・終業・休憩・休日 等）へ自動で反映される。
 */
export interface WorkHoursPreset {
  id: WorkHoursSystemId;
  /** 選択肢ラベル */
  label: string;
  /** 補足説明（フォームのヘルプ表示用） */
  description: string;
  /** 始業時刻（HH:MM） */
  startTime: string;
  /** 終業時刻（HH:MM） */
  endTime: string;
  /** 休憩時間（分） */
  breakMinutes: number;
  /** 1週間の所定労働時間（時間） */
  weeklyHours: number;
  /** 変形労働時間制の単位（該当しない場合は空文字） */
  variablePeriod: string;
  /** 休日 */
  holidays: string;
}

/** 定年制タイプの選択肢定義 */
export interface RetirementOption {
  id: RetirementType;
  label: string;
  description: string;
}

/** 特約条項（業種特有の追加条文）の定義 */
export interface SpecialClauseDef {
  id: SpecialClauseId;
  /** フォームのトグルに表示する短いラベル */
  label: string;
  /** 服務規律の章に挿入する条見出し */
  title: string;
  /** 条文本文（行配列。"- " 始まりは箇条書き） */
  body: string[];
}

/**
 * 業種別プリセット。クリックすると、労働時間システム・定年制・特約条項を
 * 業界標準の組み合わせに一括で書き換える。会社名等の個別項目は維持される。
 */
export interface IndustryPreset {
  id: IndustryId;
  label: string;
  description: string;
  /** 適用する労働時間システム */
  workHoursSystem: WorkHoursSystemId;
  /** 適用する定年制 */
  retirementType: RetirementType;
  /** 自動挿入する特約条項 */
  specialClauses: SpecialClauseId[];
}

/**
 * フレックスタイム制を選択したときにのみ使う詳細設定。
 * 労働時間システムが "flextime" のときだけフォームに表示・条文に反映される。
 */
export interface FlextimeSettings {
  /** 清算期間（例：1ヶ月） */
  settlementPeriod: string;
  /** コアタイム（必ず勤務する時間帯）を設けるか */
  hasCoreTime: boolean;
  /** コアタイム開始（HH:MM） */
  coreStart: string;
  /** コアタイム終了（HH:MM） */
  coreEnd: string;
  /** フレキシブルタイム・始業帯の開始（HH:MM） */
  flexStartFrom: string;
  /** フレキシブルタイム・始業帯の終了（HH:MM） */
  flexStartTo: string;
  /** フレキシブルタイム・終業帯の開始（HH:MM） */
  flexEndFrom: string;
  /** フレキシブルタイム・終業帯の終了（HH:MM） */
  flexEndTo: string;
}

/**
 * 就業規則フォームの状態（=プレビューの入力ソース）。
 * すべての項目がプレビューにリアルタイム連動する。
 */
export interface WorkRulesData {
  // ── 第1章 総則 ──────────────────────────────
  /** 会社名 */
  companyName: string;
  /** 施行日（YYYY-MM-DD） */
  effectiveDate: string;

  // ── 労働時間、休憩及び休日 ──────────────────
  /** 選択中の労働時間システム */
  workHoursSystem: WorkHoursSystemId;
  /** 始業時刻（HH:MM） */
  startTime: string;
  /** 終業時刻（HH:MM） */
  endTime: string;
  /** 休憩時間（分） */
  breakMinutes: number;
  /** 1週間の所定労働時間（時間） */
  weeklyHours: number;
  /** 変形労働時間制の単位（該当しない場合は空文字） */
  variablePeriod: string;
  /** 休日 */
  holidays: string;
  /** フレックスタイム制の詳細設定（system が "flextime" のときに使用） */
  flextime: FlextimeSettings;

  // ── 勤務間インターバル ──────────────────────
  /** 勤務間インターバル制度の有無 */
  intervalEnabled: boolean;
  /** インターバル時間（時間） */
  intervalHours: number;

  // ── 服務規律（特約条項） ────────────────────
  /** 服務規律の章に挿入する特約条項のID一覧 */
  specialClauses: SpecialClauseId[];

  // ── 定年、退職及び解雇 ──────────────────────
  /** 定年制のタイプ */
  retirementType: RetirementType;
}
