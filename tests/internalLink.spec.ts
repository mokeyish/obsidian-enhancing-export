
import { exec, testConversion } from './common';


test('test basic internal link block parsing', async () => {
  await testConversion('internal-link-basic', 'markdown')
});

test('test complex internal link block parsing', async () => {
  await testConversion('internal-link-bullet', 'markdown')
});

test('test basic internal link with description', async () => {
  await testConversion('internal-link-described', 'markdown')
});
