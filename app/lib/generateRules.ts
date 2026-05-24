/**
 * フォーム入力（WorkRulesData）から就業規則のMarkdownテキストを生成する。
 *
 * 労働時間システム・勤務間インターバルの有無・定年制タイプの条件分岐により、
 * 条文の内容と条番号が動的に変化する。
 */

import { getPreset, getSpecialClause } from "./presets";
import type { WorkRulesData } from "./types";

// ── 時刻・期間ユーティリティ ──────────────────────────────

/** "HH:MM" を 0時起点の分に変換 */
function parseTime(time: string): number {
  const [h, m] = time.split(":").map((v) => Number(v) || 0);
  return h * 60 + m;
}

/**
 * 始業〜終業の拘束時間から休憩を引いた「実働分」を返す。
 * 終業が始業より前（深夜またぎ）の場合は24時間を加算する。
 */
export function workingMinutes(
  start: string,
  end: string,
  breakMinutes: number,
): number {
  let diff = parseTime(end) - parseTime(start);
  if (diff < 0) diff += 24 * 60;
  return Math.max(0, diff - breakMinutes);
}

/** 分を「X時間Y分」表記に整形（0分のときは「X時間」） */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

/** "YYYY-MM-DD" を「YYYY年M月D日」に整形 */
export function formatJapaneseDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso || "（施行日未設定）";
  const [, y, m, d] = match;
  return `${Number(y)}年${Number(m)}月${Number(d)}日`;
}

// ── 就業規則本文の生成 ────────────────────────────────────

/** 条番号を自動採番しながら本文を組み立てるヘルパー */
class ArticleBuilder {
  private lines: string[] = [];
  private articleNo = 0;
  private chapterNo = 0;

  /** 章見出しを追加（章番号は自動採番）。title は章名のみを渡す。 */
  chapter(title: string): void {
    this.chapterNo += 1;
    this.lines.push(`## 第${this.chapterNo}章　${title}`, "");
  }

  /** 条文を追加（条番号は自動採番）。body は行配列。 */
  article(title: string, body: string[]): void {
    this.articleNo += 1;
    this.lines.push(`### 第${this.articleNo}条（${title}）`, "");
    this.lines.push(...body, "");
  }

  /** 見出しを付けない生テキストを追加 */
  raw(...lines: string[]): void {
    this.lines.push(...lines);
  }

  toString(): string {
    return this.lines.join("\n");
  }
}

/** 労働時間・休憩の条文本文を、システム種別ごとに生成 */
function workHoursBody(data: WorkRulesData): string[] {
  const preset = getPreset(data.workHoursSystem);
  const actual = formatDuration(
    workingMinutes(data.startTime, data.endTime, data.breakMinutes),
  );
  const schedule = [
    `- 始業時刻　${data.startTime}`,
    `- 終業時刻　${data.endTime}`,
    `- 休憩時間　${data.breakMinutes}分`,
  ];

  switch (data.workHoursSystem) {
    case "monthlyVariable715":
      return [
        "1. 会社は、1ヶ月単位の変形労働時間制を採用する。1ヶ月を平均して1週間あたりの労働時間が40時間を超えない範囲内において、特定の日又は週に1日8時間又は1週40時間を超えて労働させることがある。",
        "2. 始業・終業の時刻及び休憩時間は、原則として次のとおりとする。ただし、各日の労働時間は会社が作成する勤務割表（シフト表）により前月末日までに通知する。",
        ...schedule,
        `3. 1日の所定労働時間は${actual}を基本とし、1週間の所定労働時間は平均して${data.weeklyHours}時間とする。`,
      ];
    case "yearlyVariable":
      return [
        "1. 会社は、1年単位の変形労働時間制を採用する。対象期間を平均して1週間あたりの労働時間が40時間を超えない範囲内において、会社が定める年間カレンダーに基づき労働させる。",
        "2. 始業・終業の時刻及び休憩時間は、原則として次のとおりとする。",
        ...schedule,
        `3. 1日の所定労働時間は${actual}を基本とし、各日の労働時間及び年間休日は会社が定める年間カレンダーによる。`,
      ];
    case "flextime": {
      const f = data.flextime;
      const coreLine = f.hasCoreTime
        ? `3. コアタイム（従業員が必ず勤務しなければならない時間帯）は、${f.coreStart}から${f.coreEnd}までとする。`
        : "3. コアタイム（必ず勤務しなければならない時間帯）は設けない。";
      const breakNote = f.hasCoreTime
        ? `5. 休憩時間は${data.breakMinutes}分とし、原則としてコアタイム中に取得するものとする。`
        : `5. 休憩時間は${data.breakMinutes}分とする。`;
      return [
        "1. 会社は、フレックスタイム制を採用する。従業員は、清算期間における総労働時間の範囲内で、各日の始業及び終業の時刻を自己の決定により働くことができる。",
        `2. 清算期間は${f.settlementPeriod}とし、標準となる1日の労働時間は${actual}（1週間あたり${data.weeklyHours}時間に相当）とする。`,
        coreLine,
        "4. フレキシブルタイム（従業員がその選択により労働することができる時間帯）は、次のとおりとする。",
        `- 始業帯　${f.flexStartFrom}から${f.flexStartTo}まで`,
        `- 終業帯　${f.flexEndFrom}から${f.flexEndTo}まで`,
        breakNote,
      ];
    }
    case "discretionary":
      return [
        "1. 会社は、専門業務型裁量労働制を採用する。対象業務に従事する従業員については、業務遂行の手段及び時間配分の決定を当該従業員の裁量に委ねる。",
        `2. 前項の従業員は、所定労働日に勤務した場合、1日${actual}労働したものとみなす。`,
        "3. 始業及び終業の時刻は従業員の裁量に委ねるが、会社は健康確保の観点から、勤務状況を把握し、必要な措置を講ずるものとする。",
        `4. 休憩時間は${data.breakMinutes}分とする。`,
      ];
    case "fullTwoDayOff8h":
    default:
      return [
        "1. 始業・終業の時刻及び休憩時間は、次のとおりとする。",
        ...schedule,
        `2. 1日の所定労働時間は${actual}とし、1週間の所定労働時間は${data.weeklyHours}時間とする。`,
        `（${preset.label}）`,
      ];
  }
}

/** 定年等の条文本文を、定年制タイプごとに生成。タイトルと本文を返す。 */
function retirementArticle(data: WorkRulesData): { title: string; body: string[] } {
  switch (data.retirementType) {
    case "none":
      return {
        title: "定年",
        body: ["会社は、従業員の定年を定めない。"],
      };
    case "age65":
      return {
        title: "定年",
        body: [
          "従業員の定年は満65歳とし、定年に達した日の属する月の末日をもって退職とする。",
        ],
      };
    case "age70":
      return {
        title: "定年",
        body: [
          "従業員の定年は満70歳とし、定年に達した日の属する月の末日をもって退職とする。",
        ],
      };
    case "age65Measure70":
      return {
        title: "定年等",
        body: [
          "1. 従業員の定年は満65歳とし、定年に達した日の属する月の末日をもって退職とする。",
          "2. 会社は、定年後も就業を希望する従業員について、高年齢者等の雇用の安定等に関する法律に基づき、満70歳までの就業確保措置を講ずるよう努める。",
        ],
      };
    case "age60Continue65":
    default:
      return {
        title: "定年等",
        body: [
          "1. 従業員の定年は満60歳とし、定年に達した日の属する月の末日をもって退職とする。",
          "2. 前項の規定にかかわらず、定年後も引き続き雇用されることを希望し、解雇事由又は退職事由に該当しない従業員については、満65歳まで継続雇用する。",
        ],
      };
  }
}

/**
 * フォームデータから就業規則のMarkdownテキスト全文を生成する。
 */
export function generateRules(data: WorkRulesData): string {
  const company = data.companyName.trim() || "（会社名未入力）";
  const b = new ArticleBuilder();

  // タイトル
  b.raw(`# ${company}　就業規則`, "");

  // 第1章 総則
  b.chapter("総則");
  b.article("目的", [
    `1. この就業規則（以下「規則」という。）は、労働基準法第89条に基づき、${company}（以下「会社」という。）の従業員の労働条件、服務規律その他の就業に関する事項を定めるものである。`,
    "2. この規則に定めのない事項については、労働基準法その他の法令の定めるところによる。",
  ]);
  b.article("適用範囲", [
    "1. この規則は、会社の従業員に適用する。",
    "2. パートタイム労働者等の就業に関する事項については、別に定めるところによる。",
  ]);

  // 第2章 服務規律（基本原則＋業種特有の特約条項）
  b.chapter("服務規律");
  b.article("服務の基本原則", [
    "1. 従業員は、職務上の責任を自覚し、誠実に職務を遂行するとともに、会社の指示命令に従い、相互に協力して職場の秩序を維持しなければならない。",
    "2. 従業員は、次に掲げる事項を守らなければならない。",
    "- 勤務中は職務に専念し、みだりに職場を離れないこと",
    "- 会社の施設・物品を大切に取り扱い、許可なく私用に供さないこと",
    "- 会社の名誉又は信用を傷つける行為をしないこと",
  ]);
  // 業種別プリセット等で選択された特約条項を順に挿入
  for (const id of data.specialClauses) {
    const clause = getSpecialClause(id);
    if (clause) b.article(clause.title, clause.body);
  }

  // 第3章 労働時間、休憩及び休日
  b.chapter("労働時間、休憩及び休日");
  b.article("労働時間及び休憩時間", workHoursBody(data));
  b.article("休日", [
    "休日は、次のとおりとする。",
    `- ${data.holidays}`,
  ]);

  // 勤務間インターバル（有効時のみ）
  if (data.intervalEnabled) {
    b.article("勤務間インターバル", [
      `1. 会社は、従業員ごとに、1日の勤務終了後、次の勤務の開始までに少なくとも${data.intervalHours}時間の休息時間（勤務間インターバル）を確保するものとする。`,
      "2. 前項により次の勤務の始業時刻が繰り下がる場合において、繰り下がった時間に係る部分は、当該勤務をしたものとみなす。",
    ]);
  }

  // 第4章 定年、退職及び解雇
  b.chapter("定年、退職及び解雇");
  const retire = retirementArticle(data);
  b.article(retire.title, retire.body);

  // 附則
  b.raw("---", "");
  b.raw("## 附則", "");
  b.raw(`この規則は、${formatJapaneseDate(data.effectiveDate)}から施行する。`);

  return b.toString();
}
