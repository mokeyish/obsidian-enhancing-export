import { testConversion } from './common';


// Regression test for the pandoc >= 3.8 code path in lua/pdf.lua
// (the `is_partially_supported` branch). Before the fix this branch crashed
// with "attempt to call a nil value (method 'gsub')" because it called
// `pandoc.text:gsub(...)` instead of `elem.text:gsub(...)`, and it also
// passed the arguments to `pandoc.Math` in the wrong order.
// The fixture exercises both the `\begin{...}` environment branch and the
// plain inline-math passthrough branch.
test('test pdf.lua math environment filter (pandoc >= 3.8)', async () => {
  await testConversion('pdf-math-env', 'pdf');
});
