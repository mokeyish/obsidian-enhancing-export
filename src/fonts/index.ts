/*
 * Multilingual font fallback.
 *
 * Detects the writing systems used by a document and produces the format
 * specific fallback declarations:
 *  - a LaTeX header for PDF / LaTeX (through `--include-in-header`)
 *  - a CSS snippet for HTML / epub
 *
 * Detection combines the `lang` front matter field (or the Obsidian locale)
 * with an actual scan of the document text, so mixed documents are handled too.
 */

/* eslint-disable no-misleading-character-class */

import { CJK_SCRIPTS, LANGUAGE_SCRIPTS, PAN_CJK_MONO, PAN_CJK_SANS, PAN_CJK_SERIF, SCRIPTS, ScriptDefinition, ScriptId } from './registry';

export interface FontOptions {
  metadata?: Record<string, unknown>;
  /** User supplied fonts, tried before the built-in candidates. */
  extraFonts?: string[];
}

const SCRIPT_PATTERNS: Array<[ScriptId, RegExp]> = [
  ['han', /[\u2E80-\u2EFF\u3000-\u303F\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u{20000}-\u{2FA1F}]/u],
  ['kana', /[\u3040-\u30FF\u31F0-\u31FF]/u],
  ['hangul', /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/u],
  ['cyrillic', /[\u0400-\u04FF\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F]/u],
  ['greek', /[\u0370-\u03FF\u1F00-\u1FFF]/u],
  ['devanagari', /[\u0900-\u097F\uA8E0-\uA8FF]/u],
  ['thai', /[\u0E00-\u0E7F]/u],
  ['arabic', /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/u],
  ['hebrew', /[\u0590-\u05FF]/u],
];

/** Language tag ("zh-CN", "ja", "pt_BR") → script ids. */
export function scriptsFromLanguage(lang?: string): ScriptId[] {
  if (!lang) {
    return [];
  }
  const prefix = lang.toLowerCase().replace('_', '-').split('-')[0];
  return LANGUAGE_SCRIPTS[prefix] ?? [];
}

/**
 * Detect the scripts used by a document, language hint first, then by scanning
 * the text. Scripts are ordered by importance so the most used one wins.
 */
export function detectScripts(text?: string, lang?: string): ScriptId[] {
  const ordered: ScriptId[] = [];
  const add = (id: ScriptId) => {
    if (!ordered.includes(id)) {
      ordered.push(id);
    }
  };

  scriptsFromLanguage(lang).forEach(add);

  if (text) {
    const scanned = SCRIPT_PATTERNS.map(([id, pattern]) => {
      const matches = text.match(new RegExp(pattern.source, `${pattern.flags.replace('g', '')}g`));
      return [id, matches?.length ?? 0] as const;
    })
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
    scanned.forEach(([id]) => add(id));
  }

  return ordered;
}

const asString = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined);

const cssQuote = (font: string) => `"${font.replaceAll('"', '\\"')}"`;

const cssFont = (font: string) => (font.includes(' ') || font.includes('"') ? cssQuote(font) : font);

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function mergeCandidates(scripts: ScriptDefinition[], kind: 'main' | 'sans' | 'mono'): string[] {
  return unique(scripts.flatMap(script => script[kind]));
}

function escapeLatexFont(font: string): string {
  // Font names are used inside \IfFontExistsTF{...}; drop characters that would
  // be interpreted as TeX syntax instead of a font name.
  return font.replaceAll(/[\\{}$#%&_^~]/g, '');
}

/** Nested \IfFontExistsTF so a missing font never aborts the latex run. */
function fontExistsChain(fonts: string[], setter: (font: string) => string): string {
  const [font, ...rest] = unique(fonts).map(escapeLatexFont).filter(Boolean);
  if (!font) {
    return '';
  }
  const fallback = rest.length ? fontExistsChain(rest, setter) : '';
  return `\\IfFontExistsTF{${font}}{${setter(font)}}{${fallback}}`;
}

function cjkScripts(scripts: ScriptId[]): ScriptDefinition[] {
  return scripts.filter(id => CJK_SCRIPTS.includes(id)).map(id => SCRIPTS[id]);
}

function baseScripts(scripts: ScriptId[]): ScriptDefinition[] {
  return scripts.filter(id => SCRIPTS[id]?.strategy === 'base').map(id => SCRIPTS[id]);
}

function cjkLanguageTag(scripts: ScriptId[]): string {
  if (scripts.includes('kana')) {
    return 'ja';
  }
  if (scripts.includes('hangul')) {
    return 'ko';
  }
  return 'zh';
}

function panCjkFor(kind: 'main' | 'sans' | 'mono', multiple: boolean): string[] {
  if (!multiple) {
    return [];
  }
  return kind === 'main' ? PAN_CJK_SERIF : kind === 'sans' ? PAN_CJK_SANS : PAN_CJK_MONO;
}

function xetexCjkBlock(scripts: ScriptDefinition[], options: FontOptions): string[] {
  const metadata = options.metadata ?? {};
  const extra = options.extraFonts ?? [];
  const multiple = scripts.length > 1;
  const main = [...extra, asString(metadata['CJKmainfont']) ?? '', ...panCjkFor('main', multiple), ...mergeCandidates(scripts, 'main')];
  const sans = [...extra, asString(metadata['CJKsansfont']) ?? '', ...panCjkFor('sans', multiple), ...mergeCandidates(scripts, 'sans')];
  const mono = [...extra, asString(metadata['CJKmonofont']) ?? '', ...panCjkFor('mono', multiple), ...mergeCandidates(scripts, 'mono')];
  return [
    '\\usepackage{xeCJK}',
    fontExistsChain(main, f => `\\setCJKmainfont{${f}}`),
    fontExistsChain(sans, f => `\\setCJKsansfont{${f}}`),
    fontExistsChain(mono, f => `\\setCJKmonofont{${f}}`),
  ];
}

function luatexCjkBlock(scripts: ScriptDefinition[], options: FontOptions): string[] {
  const metadata = options.metadata ?? {};
  const extra = options.extraFonts ?? [];
  const multiple = scripts.length > 1;
  const main = [...extra, asString(metadata['CJKmainfont']) ?? '', ...panCjkFor('main', multiple), ...mergeCandidates(scripts, 'main')];
  const sans = [...extra, asString(metadata['CJKsansfont']) ?? '', ...panCjkFor('sans', multiple), ...mergeCandidates(scripts, 'sans')];
  const mono = [...extra, asString(metadata['CJKmonofont']) ?? '', ...panCjkFor('mono', multiple), ...mergeCandidates(scripts, 'mono')];
  return [
    '\\usepackage{luatexja-fontspec}',
    fontExistsChain(main, f => `\\setmainjfont{${f}}`),
    fontExistsChain(sans, f => `\\setsansjfont{${f}}`),
    fontExistsChain(mono, f => `\\setmonojfont{${f}}`),
  ];
}

function baseFontBlock(scripts: ScriptDefinition[], options: FontOptions): string[] {
  const metadata = options.metadata ?? {};
  const extra = options.extraFonts ?? [];
  const main = [...extra, asString(metadata['mainfont']) ?? '', ...mergeCandidates(scripts, 'main')];
  const sans = [...extra, asString(metadata['sansfont']) ?? '', ...mergeCandidates(scripts, 'sans')];
  const mono = [...extra, asString(metadata['monofont']) ?? '', ...mergeCandidates(scripts, 'mono')];
  return [
    '\\usepackage{fontspec}',
    fontExistsChain(main, f => `\\setmainfont{${f}}`),
    fontExistsChain(sans, f => `\\setsansfont{${f}}`),
    fontExistsChain(mono, f => `\\setmonofont{${f}}`),
  ];
}

/** LaTeX header injected for PDF / LaTeX output. Empty string when not needed. */
export function buildFontHeader(scripts: ScriptId[], options: FontOptions = {}): string {
  const cjk = cjkScripts(scripts);
  const base = baseScripts(scripts);
  if (cjk.length === 0 && base.length === 0) {
    return '';
  }

  const xetex = [
    ...(cjk.length ? xetexCjkBlock(cjk, options) : []),
    ...(cjk.length ? [`\\XeTeXlinebreaklocale "${cjkLanguageTag(scripts)}"`, '\\XeTeXlinebreakskip = 0pt plus 1pt'] : []),
    ...(base.length ? baseFontBlock(base, options) : []),
  ];
  const luatex = [...(cjk.length ? luatexCjkBlock(cjk, options) : []), ...(base.length ? baseFontBlock(base, options) : [])];

  return `% Generated by obsidian-enhancing-export: multilingual font fallback.
\\ifdefined\\XeTeXversion
  ${xetex.join('\n  ')}
\\else\\ifdefined\\directlua
  ${luatex.join('\n  ')}
\\fi\\fi
`;
}

const LATIN_SANS = ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'];
const LATIN_SERIF = ['Georgia', 'Times New Roman', 'Times'];
const LATIN_MONO = ['SF Mono', 'Menlo', 'Consolas', 'Liberation Mono'];

function cssStack(latin: string[], scriptFonts: string[], generic: string): string {
  return [...latin, ...scriptFonts, generic].map(cssFont).join(', ');
}

/** CSS snippet injected for HTML / epub output. Empty string when not needed. */
export function buildFontStyle(scripts: ScriptId[], options: FontOptions = {}): string {
  const definitions = scripts.map(id => SCRIPTS[id]).filter(Boolean);
  if (definitions.length === 0) {
    return '';
  }
  const extra = options.extraFonts ?? [];
  const multiple = cjkScripts(scripts).length > 1;
  const withExtra = (kind: 'main' | 'sans' | 'mono') => [...extra, ...panCjkFor(kind, multiple), ...mergeCandidates(definitions, kind)];

  const body = cssStack(LATIN_SANS, withExtra('sans'), 'sans-serif');
  const heading = cssStack(LATIN_SERIF, withExtra('main'), 'serif');
  const code = cssStack(LATIN_MONO, withExtra('mono'), 'monospace');

  return `html, body {
  font-family: ${body};
}
h1, h2, h3, h4, h5, h6 {
  font-family: ${heading};
}
code, kbd, pre, samp, tt {
  font-family: ${code};
}
p, li, td, th {
  line-break: strict;
  overflow-wrap: break-word;
}
img, svg {
  max-width: 100%;
  height: auto;
}
figure, .figure {
  text-align: center;
}
`;
}
