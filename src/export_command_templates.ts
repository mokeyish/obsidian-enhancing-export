import type { ExportSetting } from './settings';

/*
 * Variables
 *   /User/aaa/Documents/test.pdf
 * - ${outputDir}             --> /User/aaa/Documents/
 * - ${outputPath}            --> /User/aaa/Documents/test.pdf
 * - ${outputFileName}        --> test
 * - ${outputFileFullName}    --> test.pdf
 *
 *   /User/aaa/Documents/test.pdf
 * - ${currentDir}            --> /User/aaa/Documents/
 * - ${currentPath}           --> /User/aaa/Documents/test.pdf
 * - ${CurrentFileName}       --> test
 * - ${CurrentFileFullName}   --> test.pdf
 */

export default {
  'Markdown': {
    name: 'Markdown',
    type: 'pandoc',
    arguments:
      '-f markdown --resource-path="${currentDir}" --lua-filter="${pluginDir}/lua/markdown.lua" -s -o "${outputPath}" -t commonmark_x-attributes',
    extension: '.md',
  },
  'Markdown (Hugo)': {
    name: 'Markdown (Hugo)',
    type: 'pandoc',
    arguments:
      '-f markdown --resource-path="${currentDir}" --lua-filter="${pluginDir}/lua/markdown+hugo.lua" -s -o "${outputPath}" -t commonmark_x-attributes',
    extension: '.md',
  },
  'Html': {
    name: 'Html',
    type: 'pandoc',
    arguments:
      '-f markdown --resource-path="${currentDir}" --self-contained --metadata title="${currentFileName}" -s -o "${outputPath}" -t html',
    customArguments: '--mathjax="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg-full.js"',
    extension: '.html',
  },
  'PDF': {
    name: 'PDF',
    type: 'pandoc',
    arguments:
      '-f markdown --resource-path="${currentDir}" --self-contained --metadata title="${currentFileName}" -s -o "${outputPath}" -t pdf',
    extension: '.pdf',
  },
  'Word (.docx)': {
    name: 'Word (.docx)',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t docx',
    extension: '.docx',
  },
  'OpenOffice': {
    name: 'OpenOffice',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t odt',
    extension: '.odt',
  },
  'RTF': {
    name: 'RTF',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t rtf',
    extension: '.rtf',
  },
  'Epub': {
    name: 'Epub',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t epub',
    extension: '.epub',
  },
  'Latex': {
    name: 'Latex',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t latex',
    extension: '.latex',
  },
  'Media Wiki': {
    name: 'Media Wiki',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t mediawiki',
    extension: '.mediawiki',
  },
  'reStructuredText': {
    name: 'reStructuredText',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t rst',
    extension: '.rst',
  },
  'Textile': {
    name: 'Textile',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t textile',
    extension: '.textile',
  },
  'OPML': {
    name: 'OPML',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t opml',
    extension: '.opml',
  },
  'Custom': {
    name: 'Custom',
    type: 'custom',
    command: 'your command',
  },
} as Record<string, ExportSetting>;
