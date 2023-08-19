import { getPandocVersion } from '../src/pandoc';


test('test get pandoc version', async () => {
  const out = await getPandocVersion();
  expect(out.compare('3.1.5')).toBe(1);
});