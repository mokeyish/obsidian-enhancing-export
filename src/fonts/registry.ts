/*
 * Script → font candidate registry.
 *
 * This is the single place that knows about fonts. Adding a new writing system
 * should only require a new entry here, no changes to the export pipeline.
 *
 * Font names are ordered from the most desirable to the most widely available
 * across macOS, Windows and Linux. The exporters only ever try them through
 * "is this font installed?" guards, so a missing entry never breaks an export.
 */

export type ScriptId = 'han' | 'kana' | 'hangul' | 'cyrillic' | 'greek' | 'devanagari' | 'thai' | 'arabic' | 'hebrew';

export type FontStrategy =
  /** Handled through xeCJK / luatexja. */
  | 'cjk'
  /** Handled by replacing the base (serif/sans) font with a Unicode font. */
  | 'base'
  /** Right-to-left scripts; needs polyglossia/bidi, not implemented yet. */
  | 'rtl';

export interface ScriptDefinition {
  id: ScriptId;
  strategy: FontStrategy;
  main: string[];
  sans: string[];
  mono: string[];
}

export const SCRIPTS: Record<ScriptId, ScriptDefinition> = {
  han: {
    id: 'han',
    strategy: 'cjk',
    main: [
      'Songti SC',
      'SimSun',
      'Noto Serif CJK SC',
      'Source Han Serif SC',
      'Source Han Serif CN',
      'AR PL UMing CN',
      'WenQuanYi Zen Hei',
      'Arial Unicode MS',
    ],
    sans: [
      'PingFang SC',
      'Microsoft YaHei',
      'Noto Sans CJK SC',
      'Source Han Sans SC',
      'Source Han Sans CN',
      'Heiti SC',
      'WenQuanYi Micro Hei',
      'Arial Unicode MS',
    ],
    mono: ['Sarasa Mono SC', 'Noto Sans Mono CJK SC', 'Source Han Mono SC', 'WenQuanYi Zen Hei Mono', 'PingFang SC', 'Menlo', 'Consolas'],
  },
  kana: {
    id: 'kana',
    strategy: 'cjk',
    main: ['Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif CJK JP', 'Source Han Serif JP', 'MS Mincho', 'Songti SC'],
    sans: ['Hiragino Sans', 'Yu Gothic', 'Noto Sans CJK JP', 'Source Han Sans JP', 'Meiryo', 'PingFang SC'],
    mono: ['Sarasa Mono J', 'Noto Sans Mono CJK JP', 'Osaka-Mono', 'Menlo'],
  },
  hangul: {
    id: 'hangul',
    strategy: 'cjk',
    main: ['Apple SD Gothic Neo', 'Nanum Myeongjo', 'Noto Serif CJK KR', 'Source Han Serif KR', 'Batang', 'Malgun Gothic'],
    sans: ['Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans CJK KR', 'Source Han Sans KR', 'Dotum'],
    mono: ['D2Coding', 'Noto Sans Mono CJK KR', 'Menlo'],
  },
  cyrillic: {
    id: 'cyrillic',
    strategy: 'base',
    main: ['Noto Serif', 'DejaVu Serif', 'PT Serif', 'Times New Roman', 'Liberation Serif', 'Arial Unicode MS'],
    sans: ['Noto Sans', 'DejaVu Sans', 'PT Sans', 'Arial', 'Liberation Sans'],
    mono: ['DejaVu Sans Mono', 'Noto Sans Mono', 'Consolas', 'Menlo'],
  },
  greek: {
    id: 'greek',
    strategy: 'base',
    main: ['Noto Serif', 'DejaVu Serif', 'GFS Didot', 'Times New Roman', 'Liberation Serif'],
    sans: ['Noto Sans', 'DejaVu Sans', 'GFS Neohellenic', 'Arial', 'Liberation Sans'],
    mono: ['DejaVu Sans Mono', 'Noto Sans Mono', 'Consolas'],
  },
  devanagari: {
    id: 'devanagari',
    strategy: 'base',
    main: ['Noto Serif Devanagari', 'Noto Sans Devanagari', 'Kohinoor Devanagari', 'Mangal', 'Nirmala UI'],
    sans: ['Noto Sans Devanagari', 'Kohinoor Devanagari', 'Mangal', 'Nirmala UI'],
    mono: ['Noto Sans Mono', 'DejaVu Sans Mono'],
  },
  thai: {
    id: 'thai',
    strategy: 'base',
    main: ['Noto Serif Thai', 'Thonburi', 'Angsana New', 'Leelawadee UI', 'Tahoma'],
    sans: ['Noto Sans Thai', 'Thonburi', 'Tahoma', 'Leelawadee UI'],
    mono: ['Noto Sans Mono', 'DejaVu Sans Mono', 'Tahoma'],
  },
  // RTL scripts are recognised so users get a clear message, but rendering them
  // requires polyglossia/bidi and is intentionally left for a later iteration.
  arabic: { id: 'arabic', strategy: 'rtl', main: [], sans: [], mono: [] },
  hebrew: { id: 'hebrew', strategy: 'rtl', main: [], sans: [], mono: [] },
};

/** Language tag prefix (from front matter `lang` or the Obsidian locale) → scripts. */
export const LANGUAGE_SCRIPTS: Record<string, ScriptId[]> = {
  zh: ['han'],
  ja: ['kana', 'han'],
  ko: ['hangul'],
  ru: ['cyrillic'],
  uk: ['cyrillic'],
  be: ['cyrillic'],
  bg: ['cyrillic'],
  sr: ['cyrillic'],
  mk: ['cyrillic'],
  kk: ['cyrillic'],
  el: ['greek'],
  hi: ['devanagari'],
  mr: ['devanagari'],
  ne: ['devanagari'],
  sa: ['devanagari'],
  th: ['thai'],
  ar: ['arabic'],
  fa: ['arabic'],
  ur: ['arabic'],
  he: ['hebrew'],
};

export const CJK_SCRIPTS: ScriptId[] = ['han', 'kana', 'hangul'];

/**
 * When more than one CJK script is present (e.g. Chinese + Korean) a single
 * regional font is not enough; these pan-CJK fonts cover Han, Kana and Hangul.
 */
export const PAN_CJK_SERIF = ['Noto Serif CJK SC', 'Noto Serif CJK JP', 'Noto Serif CJK KR', 'Source Han Serif SC', 'Arial Unicode MS'];

export const PAN_CJK_SANS = [
  'Noto Sans CJK SC',
  'Noto Sans CJK JP',
  'Noto Sans CJK KR',
  'Source Han Sans SC',
  'PingFang SC',
  'Arial Unicode MS',
];

export const PAN_CJK_MONO = ['Sarasa Mono SC', 'Noto Sans Mono CJK SC', 'Source Han Mono SC', 'WenQuanYi Zen Hei Mono', 'Arial Unicode MS'];
