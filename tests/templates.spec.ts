import * as fs from 'fs';
import * as path from 'path';

const TEMPLATE_DIR = path.join(__dirname, '..', 'textemplate');

// Templates offered by the plugin (must define the macros Pandoc relies on).
const TEMPLATES = ['chinese-thesis.tex', 'ieee.tex', 'lncs.tex', 'neurips.tex', 'dissertation.tex'];

describe.each(TEMPLATES)('%s', template => {
  const content = fs.readFileSync(path.join(TEMPLATE_DIR, template), 'utf-8');

  test('renders the document body', () => {
    expect(content).toContain('$body$');
  });

  test('defines the pandoc helper macros', () => {
    expect(content).toContain('pandocbounded');
    expect(content).toContain('tightlist');
  });

  test('includes the syntax highlighting macros', () => {
    expect(content).toContain('highlighting-macros');
  });

  test('contains no personal placeholder text', () => {
    expect(content).not.toMatch(/Leonardo|Set up Title|Add your abstract|Coauthor|hippo@cs/);
  });
});

test('preset templates exist', () => {
  const { PRESET_OPTIONS_META } = require('../src/settings');
  const options = PRESET_OPTIONS_META['textemplate'].options ?? [];
  for (const option of options as Array<{ value: string | null }>) {
    if (option.value) {
      expect(fs.existsSync(path.join(TEMPLATE_DIR, option.value))).toBe(true);
    }
  }
});
