/**
 * 労働時間システムのプリセット定義と、定年制タイプの選択肢。
 *
 * フォームで労働時間システムを選択したとき、対応するプリセットの値で
 * 数値フォーム（始業・終業・休憩・週所定・休日 等）を上書きする。
 */

import type {
  IndustryId,
  IndustryPreset,
  RetirementOption,
  SpecialClauseDef,
  SpecialClauseId,
  WorkHoursPreset,
  WorkHoursSystemId,
  WorkRulesData,
} from "./types";

/** 労働時間システムのプリセット一覧（フォームの選択肢順） */
export const WORK_HOURS_PRESETS: WorkHoursPreset[] = [
  {
    id: "fullTwoDayOff8h",
    label: "完全週休2日制（1日8時間）",
    description:
      "原則的な労働時間制。1日8時間・週40時間で、土日を休日とする標準型。",
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: 60,
    weeklyHours: 40,
    variablePeriod: "",
    holidays: "土曜日及び日曜日、国民の祝日、年末年始（12月29日～1月3日）",
  },
  {
    id: "monthlyVariable715",
    label: "1ヶ月単位の変形労働時間制（1日7時間15分）",
    description:
      "1ヶ月を平均して週40時間以内とする変形制。各日の労働時間はシフト表で定める。",
    startTime: "09:00",
    endTime: "17:15",
    breakMinutes: 60,
    weeklyHours: 40,
    variablePeriod: "1ヶ月単位",
    holidays: "日曜日その他会社が作成する勤務割表（シフト表）で定める日",
  },
  {
    id: "yearlyVariable",
    label: "1年単位の変形労働時間制（1日8時間）",
    description:
      "対象期間（最長1年）を平均して週40時間以内とする変形制。年間カレンダーで運用する。",
    startTime: "08:30",
    endTime: "17:30",
    breakMinutes: 60,
    weeklyHours: 40,
    variablePeriod: "1年単位",
    holidays: "会社が定める年間カレンダーによる（年間休日105日以上）",
  },
  {
    id: "flextime",
    label: "フレックスタイム制",
    description:
      "清算期間内の総労働時間の範囲で、始業・終業の時刻を従業員が決定できる制度。",
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: 60,
    weeklyHours: 40,
    variablePeriod: "",
    holidays: "土曜日及び日曜日、国民の祝日、年末年始（12月29日～1月3日）",
  },
  {
    id: "discretionary",
    label: "専門業務型裁量労働制（みなし労働時間）",
    description:
      "業務遂行の手段・時間配分を従業員の裁量に委ね、一定時間労働したものとみなす制度。研究開発・設計・取材編集等の専門業務向け。",
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: 60,
    weeklyHours: 40,
    variablePeriod: "",
    holidays: "土曜日及び日曜日、国民の祝日、年末年始（12月29日～1月3日）",
  },
];

/** id からプリセットを取得（見つからなければ先頭を返す） */
export function getPreset(id: WorkHoursSystemId): WorkHoursPreset {
  return WORK_HOURS_PRESETS.find((p) => p.id === id) ?? WORK_HOURS_PRESETS[0];
}

/** 定年制タイプの選択肢一覧 */
export const RETIREMENT_OPTIONS: RetirementOption[] = [
  {
    id: "none",
    label: "定年制なし",
    description: "定年を定めない。",
  },
  {
    id: "age60Continue65",
    label: "60歳定年＋継続雇用（65歳まで）",
    description: "満60歳定年とし、希望者は65歳まで継続雇用する（最も一般的）。",
  },
  {
    id: "age65",
    label: "65歳定年",
    description: "満65歳を定年とする。",
  },
  {
    id: "age65Measure70",
    label: "65歳定年＋就業確保措置（70歳まで）",
    description: "満65歳定年とし、70歳までの就業確保措置（努力義務）を講ずる。",
  },
  {
    id: "age70",
    label: "70歳定年",
    description: "満70歳を定年とする（高度人材の長期活躍を想定）。",
  },
];

/**
 * 選択した労働時間システムのプリセット値を data に反映した
 * 新しい WorkRulesData を返す。
 * （会社名・施行日・インターバル・定年など、システムに無関係な項目は維持する）
 */
export function applyWorkHoursPreset(
  data: WorkRulesData,
  id: WorkHoursSystemId,
): WorkRulesData {
  const preset = getPreset(id);
  return {
    ...data,
    workHoursSystem: preset.id,
    startTime: preset.startTime,
    endTime: preset.endTime,
    breakMinutes: preset.breakMinutes,
    weeklyHours: preset.weeklyHours,
    variablePeriod: preset.variablePeriod,
    holidays: preset.holidays,
  };
}

/** フレックスタイム制のデフォルト設定 */
export const DEFAULT_FLEXTIME = {
  settlementPeriod: "1ヶ月",
  hasCoreTime: true,
  coreStart: "10:00",
  coreEnd: "15:00",
  flexStartFrom: "07:00",
  flexStartTo: "10:00",
  flexEndFrom: "15:00",
  flexEndTo: "19:00",
} as const;

/** フォームの初期データ（完全週休2日制・60歳定年＋継続雇用） */
export function createInitialData(): WorkRulesData {
  const preset = WORK_HOURS_PRESETS[0];
  return {
    companyName: "株式会社サンプル",
    effectiveDate: "2026-04-01",
    workHoursSystem: preset.id,
    startTime: preset.startTime,
    endTime: preset.endTime,
    breakMinutes: preset.breakMinutes,
    weeklyHours: preset.weeklyHours,
    variablePeriod: preset.variablePeriod,
    holidays: preset.holidays,
    flextime: { ...DEFAULT_FLEXTIME },
    intervalEnabled: false,
    intervalHours: 11,
    specialClauses: [],
    retirementType: "age60Continue65",
  };
}

// ── 特約条項（業種特有の追加条文） ──────────────────────────

/** 特約条項の本文定義。服務規律の章に、有効なものが順に挿入される。 */
export const SPECIAL_CLAUSES: SpecialClauseDef[] = [
  {
    id: "hygieneInspection",
    label: "衛生管理・検便の義務化",
    title: "衛生管理及び健康確保",
    body: [
      "1. 従業員は、食品衛生に関する法令及び会社の定める衛生基準を遵守し、手洗い・消毒等により清潔の保持に努めなければならない。",
      "2. 会社は、調理・接客その他飲食物を取り扱う業務に従事する従業員に対し、定期的に検便その他必要な健康診断を実施する。従業員は、正当な理由なくこれを拒んではならない。",
      "3. ノロウイルス等の感染性疾患に罹患し、又はその疑いがある従業員は、直ちに会社に申し出るものとし、会社は治癒するまでの間、当該従業員に対し出勤停止を命ずることができる。",
    ],
  },
  {
    id: "snsConduct",
    label: "SNS利用規律（バイトテロ防止）",
    title: "ソーシャルメディアの利用",
    body: [
      "1. 従業員は、ソーシャル・ネットワーキング・サービス（SNS）その他のインターネット上の媒体において、会社、顧客又は取引先の信用若しくは名誉を毀損する情報を発信してはならない。",
      "2. 従業員は、店舗・調理場・バックヤード等の内外を問わず、業務に関連して不適切な写真又は動画（いわゆる「バイトテロ」に該当する行為を含む。）を撮影し、又は投稿してはならない。",
      "3. 前各項に違反した場合は、その情状に応じ、別に定める懲戒の規定により懲戒処分を行うことがある。",
    ],
  },
  {
    id: "strictConfidentiality",
    label: "厳格な秘密保持義務（BYOD制限）",
    title: "秘密保持",
    body: [
      "1. 従業員は、在職中及び退職後においても、業務上知り得た会社、顧客及び取引先の技術上・営業上の秘密（ソースコード、アルゴリズム、未公開のプロダクト情報及び個人情報を含む。）を、正当な理由なく第三者に開示し、又は私的に利用してはならない。",
      "2. 従業員は、会社の許可なく、私有のパソコン・記録媒体等（BYOD）を業務に使用し、又は業務上の情報を私有機器に複製若しくは保存してはならない。",
      "3. 従業員は、退職又は異動に際し、保有する一切の秘密情報及び記録媒体を会社に返還しなければならない。",
    ],
  },
  {
    id: "inventionAssignment",
    label: "職務発明・知的財産権の帰属",
    title: "職務発明及び知的財産権の帰属",
    body: [
      "1. 従業員が職務上行った発明・考案・創作及び業務上作成したプログラムその他の著作物に係る特許を受ける権利、著作権（著作権法第27条及び第28条の権利を含む。）その他一切の知的財産権は、その発生と同時に会社に帰属する。",
      "2. 従業員は、前項の著作物について著作者人格権を行使しないものとする。",
      "3. 会社は、職務発明等について、別に定める規程により従業員に相当の利益を与える。",
    ],
  },
  {
    id: "sideJobApproval",
    label: "副業・兼業の許可制",
    title: "副業・兼業",
    body: [
      "1. 従業員は、あらかじめ会社に所定事項を届け出て許可を得た場合に限り、勤務時間外において他の会社等の業務に従事することができる。",
      "2. 会社は、次のいずれかに該当する場合には、副業・兼業を禁止し、又は制限することができる。",
      "- 競合他社における就業その他会社の技術上・営業上の秘密が漏えいするおそれがある場合",
      "- 労務提供上の支障があると認められる場合",
      "- 会社の名誉又は信用を損なうおそれがある場合",
      "3. 従業員は、許可を得た事項に変更が生じた場合は、速やかに会社に再度届け出なければならない。",
    ],
  },
];

/** id から特約条項の定義を取得 */
export function getSpecialClause(
  id: SpecialClauseId,
): SpecialClauseDef | undefined {
  return SPECIAL_CLAUSES.find((c) => c.id === id);
}

// ── 業種別プリセット ────────────────────────────────────────

/** 業種別プリセット一覧（ボタンの表示順） */
export const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    id: "office",
    label: "一般オフィス（製造・事務）",
    description:
      "完全週休2日制・60歳定年＋継続雇用。モデル就業規則ベースの標準型。",
    workHoursSystem: "fullTwoDayOff8h",
    retirementType: "age60Continue65",
    specialClauses: [],
  },
  {
    id: "foodRetail",
    label: "飲食・小売・サービス業",
    description:
      "1ヶ月単位の変形労働時間制（シフト制）・65歳定年。衛生管理とSNS規律を追加。",
    workHoursSystem: "monthlyVariable715",
    retirementType: "age65",
    specialClauses: ["hygieneInspection", "snsConduct"],
  },
  {
    id: "itCreative",
    label: "IT・クリエイティブ業",
    description:
      "フレックスタイム制・70歳定年。秘密保持・職務発明・副業許可制を追加。",
    workHoursSystem: "flextime",
    retirementType: "age70",
    specialClauses: [
      "strictConfidentiality",
      "inventionAssignment",
      "sideJobApproval",
    ],
  },
];

/** id から業種プリセットを取得 */
export function getIndustryPreset(id: IndustryId): IndustryPreset | undefined {
  return INDUSTRY_PRESETS.find((p) => p.id === id);
}

/**
 * 業種別プリセットを data に一括反映した新しい WorkRulesData を返す。
 * 労働時間システム（＝その初期値）・定年制・特約条項を業界標準に書き換える。
 * 会社名・施行日・インターバル等の個別項目は維持し、適用後も手動調整できる。
 */
export function applyIndustryPreset(
  data: WorkRulesData,
  id: IndustryId,
): WorkRulesData {
  const industry = getIndustryPreset(id);
  if (!industry) return data;
  // まず労働時間システムのプリセット値（始業・終業・休日 等）を反映
  const withHours = applyWorkHoursPreset(data, industry.workHoursSystem);
  return {
    ...withHours,
    retirementType: industry.retirementType,
    specialClauses: [...industry.specialClauses],
  };
}
