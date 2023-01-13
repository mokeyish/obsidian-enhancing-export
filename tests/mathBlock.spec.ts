import { exec, testConversion } from './common';
import { readFile } from 'fs/promises';

test('test math block parsing', async () => {
  await testConversion('math-block', 'math_block')
});
