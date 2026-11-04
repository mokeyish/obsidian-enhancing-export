import { buildMetadataArguments, shellQuote, splitValues } from '../src/document_info';

test('no document info produces no arguments', () => {
  expect(buildMetadataArguments(undefined)).toBe('');
  expect(buildMetadataArguments({})).toBe('');
});

test('uses repeated metadata for author and keywords', () => {
  const args = buildMetadataArguments({
    title: '中文标题',
    author: '张三, 李四',
    institute: '某大学',
    date: '2025-01-01',
    keywords: '云, 调度',
  });
  expect(args).toContain('--metadata title="中文标题"');
  expect(args).toContain('--metadata institute="某大学"');
  expect(args).toContain('--metadata author="张三"');
  expect(args).toContain('--metadata author="李四"');
  expect(args).toContain('--metadata keywords="云"');
  expect(args).toContain('--metadata keywords="调度"');
});

test('shellQuote escapes metacharacters', () => {
  const quoted = shellQuote('a"b$c`d\\e');
  expect(quoted.startsWith('"')).toBe(true);
  expect(quoted.endsWith('"')).toBe(true);
  expect(quoted).toContain('\\"');
  expect(quoted).toContain('\\$');
  expect(quoted).toContain('\\`');
});

test('splitValues accepts western and chinese separators', () => {
  expect(splitValues('张三，李四；王五, Zhao')).toStrictEqual(['张三', '李四', '王五', 'Zhao']);
  expect(splitValues(undefined)).toStrictEqual([]);
});
