import { createEnv } from '../src/settings';

test('createEnv resolves the PATH placeholder', () => {
  const env = createEnv({});
  expect(env.PATH).toBeTruthy();
  expect(env.PATH).not.toContain('${PATH}');
});

test('user provided PATH replaces the default', () => {
  const env = createEnv({ PATH: '/only/this' });
  expect(env.PATH).toBe('/only/this');
});

test('user provided PATH can extend the default with ${PATH}', () => {
  const env = createEnv({ PATH: '/my/bin:${PATH}' });
  expect(env.PATH?.startsWith('/my/bin:')).toBe(true);
  expect(env.PATH).not.toContain('${PATH}');
});

test('custom environment variables are kept', () => {
  const env = createEnv({ FOO: 'bar' });
  expect(env.FOO).toBe('bar');
});
