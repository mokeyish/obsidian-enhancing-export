import { testConversion } from './common';


test('test math-block parsing', async () => {
  await testConversion('math-block', 'math_block');
});


test('test math-block-01 parsing', async () => {
  await testConversion('math-block-01', 'math_block');
});

test('test math-block-01-no-empty-lines parsing', async () => {
  await testConversion('math-block-01-no-empty-lines', 'math_block');
});

test('test math-block-01-no-empty-lines parsing filter off', async () => {
  await testConversion('math-block-01-no-empty-lines');
});




