import utf8_filenames from 'lua/utf8_filenames.lua';
import url from 'lua/url.lua';
import polyfill from 'lua/polyfill.lua';
import markdown from 'lua/markdown.lua';
import markdown_hugo from 'lua/markdown+hugo.lua';

const files = {
  'utf8_filenames.lua': utf8_filenames,
  'url.lua': url,
  'polyfill.lua': polyfill,
  'markdown.lua': markdown,
  'markdown+hugo.lua': markdown_hugo
};

export default files;
