import pandoc from '../src/pandoc';


test('test get pandoc version', async () => {
  const out = await pandoc.getVersion();
  expect(out.compare('3.1.5')).toBe(1);
});