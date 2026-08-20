import { exec } from './common';


test('does not wrap a top-level LaTeX math environment', async () => {
  const output = await exec(
    'pandoc -L ../lua/pdf.lua -f markdown -t latex ./markdowns/pdf-math-environment.md',
    { lineSeparator: '\n' },
  );

  expect(output).toContain('\\begin{align}');
  expect(output).toContain('\\end{align}');
  expect(output).not.toMatch(/\\\[\s*\\begin\{align\}/);
  expect(output).not.toMatch(/\\end\{align\}\s*\\\]/);
});
