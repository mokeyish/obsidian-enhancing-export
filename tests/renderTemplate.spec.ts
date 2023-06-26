import { renderTemplate } from '../src/utils';


test('test Template rendering', async () => {
  const out = renderTemplate('s${luaDir}e', { luaDir: 'w123' });
  expect(out).toBe('sw123e');
});

test('test Template rendering 2', async () => {
  const out = renderTemplate('${HOME}', {
    'HOME': 'C:\\Users\\Admin',
    'CommonProgramFiles(x86)': 'C:\\Program Files (x86)\\Common Files',
  });
  expect(out).toBe('C:\\Users\\Admin');
});


test('test Template rendering options.textemplate', async () => {
  expect(renderTemplate('pandoc ${ options.textemplate ? `--template="${options.textemplate}"` : `` }',
    { options: { textemplate: 'dissertation.tex' } }))
    .toBe('pandoc --template="dissertation.tex"');

  expect(renderTemplate('pandoc ${ options.textemplate ? `--template="${options.textemplate}"` : `` }',
    { options: { textemplate: null } }))
    .toBe('pandoc ');
});


test('test Template rendering with undefined variable', async () => {
  expect(renderTemplate('Hi ${user}', { }))
    .toBe('Hi ${user}');
});