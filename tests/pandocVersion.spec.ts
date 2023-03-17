import { getPandocVersion } from '../src/pandoc';


test('test get pandoc version', async () => {
  const out = await getPandocVersion();
  expect(out.compare('2.19.0')).toBe(1);
});