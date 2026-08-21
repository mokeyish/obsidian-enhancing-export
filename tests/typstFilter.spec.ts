import { exec } from './common';


test('preserves spaces when exporting to Typst', async () => {
  const output = await exec(
    'pandoc -L ../lua/markdown.lua -f markdown -t typst ./markdowns/typst-spaces.md -o -',
    { lineSeparator: '\n' },
  );

  expect(output).toContain('This is a simple sentence with spaces.');
});
