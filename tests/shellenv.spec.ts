import { buildPath } from '../src/shellenv';

const delimiter = process.platform === 'win32' ? ';' : ':';

test('buildPath keeps the process PATH', () => {
  const result = buildPath(['/custom/a', '/custom/b'].join(delimiter));
  const parts = result.split(delimiter);
  expect(parts).toContain('/custom/a');
  expect(parts).toContain('/custom/b');
});

test('buildPath removes duplicates', () => {
  const result = buildPath(['/dup', '/dup', '/other'].join(delimiter));
  const parts = result.split(delimiter);
  expect(parts.filter(p => p === '/dup')).toHaveLength(1);
  expect(parts.length).toBe(new Set(parts).size);
});

test('buildPath tolerates an undefined process PATH', () => {
  expect(buildPath(undefined)).toEqual(expect.any(String));
});
