import { exec } from './common';
import { readFile } from 'fs/promises';


test('test math block parsing', async () => {
  process.chdir(module.path);
  const input_file = './markdowns/math-block.md';
  const expect_out = './markdowns/math-block.out';
  const lua_script = '../lua/math_block.lua';
  const pandoc = `pandoc -s -L ${lua_script}  -t native -f markdown "${input_file}"`;
  const ret = await exec(pandoc, { lineSeparator: '\n'});
  // await writeFile('./out.txt', ret);
  expect(ret).toBe(await readFile(expect_out, { encoding: 'utf-8', flag: 'r' }));
});
