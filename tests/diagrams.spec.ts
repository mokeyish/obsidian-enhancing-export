import * as fs from 'fs';
import * as path from 'path';
import { prepareDiagrams, supportsDiagrams } from '../src/diagrams';

test('diagram support depends on the target extension', () => {
  expect(supportsDiagrams('.pdf')).toBe(true);
  expect(supportsDiagrams('.html')).toBe(true);
  expect(supportsDiagrams('.bib')).toBe(false);
});

test('prepareDiagrams builds a safe temp render directory', () => {
  const outputPath = '/tmp/test-output/doc.pdf';
  const context = prepareDiagrams({}, outputPath, '/plugin/lua');

  expect(context?.enabled).toBe(true);
  // Render dir must be in the OS temp directory with an ASCII-safe path
  expect(context!.renderDir).toContain(path.join(path.sep, 'obsidian-enhancing-export'));
  expect(context!.renderDir).toMatch(/render-\d+-[a-z0-9]+$/);
  expect(fs.existsSync(context!.renderDir)).toBe(true);
  expect(context!.variables['oee_diagram_enable']).toBe('1');
  expect(context!.variables['oee_diagram_filter']).toBe(path.join('/plugin/lua', 'diagrams.lua'));

  // Embedded formats do not need local images
  expect(context!.needsLocalImages).toBe(false);

  fs.rmSync(context!.renderDir, { recursive: true, force: true });
});

test('text formats need local images', () => {
  const context = prepareDiagrams({}, '/tmp/test-output/doc.md', '/plugin/lua');
  expect(context?.needsLocalImages).toBe(true);
  fs.rmSync(context!.renderDir, { recursive: true, force: true });
});

test('diagrams can be disabled', () => {
  const context = prepareDiagrams({ renderDiagrams: false }, '/tmp/oee-diagram-test/doc.pdf', '/plugin/lua');
  expect(context).toBeUndefined();
});
