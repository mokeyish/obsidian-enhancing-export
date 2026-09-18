import { buildFontHeader, buildFontStyle, detectScripts, scriptsFromLanguage } from '../src/fonts';

test('language tag maps to scripts', () => {
  expect(scriptsFromLanguage('zh-CN')).toStrictEqual(['han']);
  expect(scriptsFromLanguage('ja')).toStrictEqual(['kana', 'han']);
  expect(scriptsFromLanguage('ru_RU')).toStrictEqual(['cyrillic']);
  expect(scriptsFromLanguage('en-US')).toStrictEqual([]);
});

test('detects scripts from the document text', () => {
  expect(detectScripts('这是中文')).toStrictEqual(['han']);
  expect(detectScripts('Русский текст')).toStrictEqual(['cyrillic']);
  expect(detectScripts('Ελληνικά')).toStrictEqual(['greek']);
  expect(detectScripts('यह हिंदी')).toStrictEqual(['devanagari']);
  expect(detectScripts('ภาษาไทย')).toStrictEqual(['thai']);
  expect(detectScripts('plain english')).toStrictEqual([]);
});

test('combines the language hint with the text scan', () => {
  const scripts = detectScripts('中文 and Русский', 'ja');
  expect(scripts).toContain('kana');
  expect(scripts).toContain('han');
  expect(scripts).toContain('cyrillic');
});

test('no header/style for latin only documents', () => {
  expect(buildFontHeader([])).toBe('');
  expect(buildFontStyle([])).toBe('');
});

test('cjk scripts use xeCJK with fallback chains', () => {
  const header = buildFontHeader(['han']);
  expect(header).toContain('\\usepackage{xeCJK}');
  expect(header).toContain('\\setCJKmainfont');
  expect(header).toContain('Songti SC');
  expect(header).toContain('\\IfFontExistsTF');
});

test('mixed cjk prefers pan-cjk fonts', () => {
  const header = buildFontHeader(['han', 'hangul']);
  expect(header).toContain('Noto Serif CJK SC');
  expect(header).toContain('Arial Unicode MS');
});

test('base script scripts set the main font', () => {
  const header = buildFontHeader(['cyrillic']);
  expect(header).toContain('\\usepackage{fontspec}');
  expect(header).toContain('\\setmainfont');
  expect(header).not.toContain('xeCJK');
});

test('extra fonts and front matter take precedence', () => {
  const header = buildFontHeader(['han'], {
    metadata: { CJKmainfont: 'My Chinese Font' },
    extraFonts: ['Custom Font'],
  });
  expect(header.indexOf('Custom Font')).toBeLessThan(header.indexOf('My Chinese Font'));
  expect(header.indexOf('My Chinese Font')).toBeLessThan(header.indexOf('Songti SC'));
});

test('css style contains the fallback stacks', () => {
  const style = buildFontStyle(['cyrillic']);
  expect(style).toContain('font-family:');
  expect(style).toContain('Noto Serif');
  expect(style).toContain('sans-serif');
});
