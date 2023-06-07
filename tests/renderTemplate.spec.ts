import { renderTemplate } from '../src/utils';


test('test Template rendering', async () => {
  const out = renderTemplate('s${luaDir}e', { luaDir: 'w123' });
  expect(out).toBe('sw123e');
});