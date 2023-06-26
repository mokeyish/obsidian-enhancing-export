import { getPlatformValue, setPlatformValue } from '../src/utils';


test('test get set platformValue 1', async () => {
  const val = setPlatformValue({}, 'abc');
  expect(getPlatformValue(val)).toBe('abc');
});

test('test get set platformValue 2', async () => {
  const val = setPlatformValue({}, 'abc', '*');
  expect(getPlatformValue(val)).toBe('abc');
});

test('test get set platformValue 3', async () => {
  let val = setPlatformValue<Record<string, string>>({}, { 'a': 'x' }, '*');
  val = setPlatformValue(val, { 'b': 'y' });
  expect(getPlatformValue(val)).toStrictEqual({ 'a': 'x', 'b': 'y' });
});

test('test set platformValue on multi platform', async () => {
  const val = setPlatformValue<Record<string, string>>({}, { 'a': 'x' }, ['win32', 'darwin']);
  expect(val).toStrictEqual({
    'win32': { 'a': 'x' },
    'darwin': { 'a': 'x' }
  });
});
