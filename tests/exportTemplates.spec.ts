import exportTemplates from '../src/export_templates';

test('Pandoc export templates recognize headings without a preceding blank line', () => {
  for (const template of Object.values(exportTemplates)) {
    if (template.type === 'pandoc') {
      expect(template.arguments).toContain('${fromFormat}+space_in_atx_header-blank_before_header');
    }
  }
});
