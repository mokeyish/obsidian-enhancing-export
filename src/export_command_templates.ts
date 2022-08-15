import type { ExportSetting } from './settings';

/*
 * Variables
 * - ${attachmentFolderPath}  --> obsidian' settings.
 *
 *   /User/aaa/Documents/test.pdf
 * - ${outputDir}             --> /User/aaa/Documents/
 * - ${outputPath}            --> /User/aaa/Documents/test.pdf
 * - ${outputFileName}        --> test
 * - ${outputFileFullName}    --> test.pdf
 *
 *   /User/aaa/Documents/test.pdf
 * - ${currentDir}            --> /User/aaa/Documents/
 * - ${currentPath}           --> /User/aaa/Documents/test.pdf
 * - ${currentFileName}       --> test
 * - ${CurrentFileFullName}   --> test.pdf
 */

export default {
  'Markdown': {
    name: 'Markdown',
    type: 'pandoc',
    arguments:
      '-f markdown --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" --lua-filter="${luaDir}/markdown.lua" -s -o "${outputPath}" -t commonmark_x-attributes',
    extension: '.md',
  },
  'Markdown (Hugo)': {
    name: 'Markdown (Hugo)',
    type: 'pandoc',
    arguments:
      '-f markdown --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" --lua-filter="${luaDir}/markdown+hugo.lua" -s -o "${outputPath}" -t commonmark_x-attributes',
    extension: '.md',
  },
  'Html': {
    name: 'Html',
    type: 'pandoc',
    arguments:
      '-f markdown --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" --lua-filter="${luaDir}/math_block.lua" --embed-resources --standalone --metadata title="${currentFileName}" -s -o "${outputPath}" -t html',
    customArguments: '--mathjax="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg-full.js"',
    extension: '.html',
  },
  'TextBundle': {
    name: 'TextBundle',
    type: 'pandoc',
    arguments:
      '-f markdown --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" --lua-filter="${luaDir}/markdown.lua" -V media_dir="${outputDir}/${outputFileName}.textbundle/assets" -s -o "${outputDir}/${outputFileName}.textbundle/text.md" -t commonmark_x-attributes',
    extension: '.md',
  },
  'PDF': {
    name: 'PDF',
    type: 'pandoc',
    arguments:
      '-f markdown --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" --self-contained --metadata title="${currentFileName}" -s -o "${outputPath}" -t pdf',
    extension: '.pdf',
  },
  'Word (.docx)': {
    name: 'Word (.docx)',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -s -o "${outputPath}" -t docx',
    extension: '.docx',
  },
  'OpenOffice': {
    name: 'OpenOffice',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -s -o "${outputPath}" -t odt',
    extension: '.odt',
  },
  'RTF': {
    name: 'RTF',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -s -o "${outputPath}" -t rtf',
    extension: '.rtf',
  },
  'Epub': {
    name: 'Epub',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -s -o "${outputPath}" -t epub',
    extension: '.epub',
  },
  'Latex': {
    name: 'Latex',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -s -o "${outputPath}" -t latex',
    extension: '.latex',
  },
  'Media Wiki': {
    name: 'Media Wiki',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -s -o "${outputPath}" -t mediawiki',
    extension: '.mediawiki',
  },
  'reStructuredText': {
    name: 'reStructuredText',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -s -o "${outputPath}" -t rst',
    extension: '.rst',
  },
  'Textile': {
    name: 'Textile',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -s -o "${outputPath}" -t textile',
    extension: '.textile',
  },
  'OPML': {
    name: 'OPML',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -s -o "${outputPath}" -t opml',
    extension: '.opml',
  },
  'Custom': {
    name: 'Custom',
    type: 'custom',
    command: 'your command',
    targetFileExtensions: '.ext',
  },
} as Record<string, ExportSetting>;
