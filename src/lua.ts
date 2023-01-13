import utf8_filenames from 'lua/utf8_filenames.lua';
import url from 'lua/url.lua';
import polyfill from 'lua/polyfill.lua';
import math_block from 'lua/math_block.lua';
import markdown from 'lua/markdown.lua';
import markdown_hugo from 'lua/markdown+hugo.lua';
import pdf from 'lua/pdf.lua';

const files = {
  'utf8_filenames.lua': utf8_filenames,
  'url.lua': url,
  'polyfill.lua': polyfill,
  'math_block.lua': math_block,
  'markdown.lua': markdown,
  'markdown+hugo.lua': markdown_hugo,
  'pdf.lua': pdf,
};

export default files;
