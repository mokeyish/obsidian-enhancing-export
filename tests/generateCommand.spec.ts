import { generateCommand } from '../src/settings';


test('test command generating', async () => {
  
  const out = await generateCommand('s${luaDir}e', { luaDir: 'w123' });
  expect(out).toBe('sw123e');
});