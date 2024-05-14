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
      '-f ${fromFormat} --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" --lua-filter="${luaDir}/markdown.lua" -s -o "${outputPath}" -t commonmark_x-attributes',
    extension: '.md',
  },
  'Markdown (Hugo)': {
    name: 'Markdown (Hugo)',
    type: 'pandoc',
    arguments:
      '-f ${fromFormat} --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" --lua-filter="${luaDir}/markdown+hugo.lua" -s -o "${outputPath}" -t commonmark_x-attributes',
    extension: '.md',
  },
  'Html': {
    name: 'Html',
    type: 'pandoc',
    arguments:
      '-f ${fromFormat} --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" --lua-filter="${luaDir}/math_block.lua" --embed-resources --standalone --metadata title="${currentFileName}" -s -o "${outputPath}" -t html',
    customArguments: '--mathjax="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg-full.js"',
    extension: '.html',
  },
  'TextBundle': {
    name: 'TextBundle',
    type: 'pandoc',
    arguments:
      '-f ${fromFormat} --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" --lua-filter="${luaDir}/markdown.lua" -V media_dir="${outputDir}/${outputFileName}.textbundle/assets" -s -o "${outputDir}/${outputFileName}.textbundle/text.md" -t commonmark_x-attributes',
    extension: '.md',
  },
  'Typst': {
    name: 'Typst',
    type: 'pandoc',
    arguments:
      '-f ${fromFormat} --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" --lua-filter="${luaDir}/markdown.lua" -s -o "${outputPath}" -t typst',
    extension: '.typ',
  },
  'PDF': {
    name: 'PDF',
    type: 'pandoc',
    arguments:
      '-f ${fromFormat} --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" --lua-filter="${luaDir}/pdf.lua" ${ options.textemplate ? `--resource-path="${pluginDir}/textemplate" --template="${options.textemplate}"` : ` ` } -o "${outputPath}" -t pdf',
    customArguments: '--pdf-engine=pdflatex',
    optionsMeta: {
      'textemplate': 'preset:textemplate', // reference from `PresetOptionsMeta` in `src/settings.ts`
    },
    extension: '.pdf',
  },
  'Word (.docx)': {
    name: 'Word (.docx)',
    type: 'pandoc',
    arguments: '-f ${fromFormat} --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -o "${outputPath}" -t docx',
    extension: '.docx',
  },
  'OpenOffice': {
    name: 'OpenOffice',
    type: 'pandoc',
    arguments: '-f ${fromFormat} --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -o "${outputPath}" -t odt',
    extension: '.odt',
  },
  'RTF': {
    name: 'RTF',
    type: 'pandoc',
    arguments: '-f ${fromFormat} --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -s -o "${outputPath}" -t rtf',
    extension: '.rtf',
  },
  'Epub': {
    name: 'Epub',
    type: 'pandoc',
    arguments: '-f ${fromFormat} --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -o "${outputPath}" -t epub',
    extension: '.epub',
  },
  'Latex': {
    name: 'Latex',
    type: 'pandoc',
    arguments:
      '-f ${fromFormat} --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" ${ options.textemplate ? `--resource-path="${pluginDir}/textemplate" --template="${options.textemplate}"` : ` ` } --extract-media="${outputDir}" -s -o "${outputPath}" -t latex',
    optionsMeta: {
      'textemplate': 'preset:textemplate', // reference from `PresetOptionsMeta` in `src/settings.ts`
    },
    extension: '.tex',
  },
  'Media Wiki': {
    name: 'Media Wiki',
    type: 'pandoc',
    arguments:
      '-f ${fromFormat} --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -s -o "${outputPath}" -t mediawiki',
    extension: '.mediawiki',
  },
  'reStructuredText': {
    name: 'reStructuredText',
    type: 'pandoc',
    arguments: '-f ${fromFormat} --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -s -o "${outputPath}" -t rst',
    extension: '.rst',
  },
  'Textile': {
    name: 'Textile',
    type: 'pandoc',
    arguments:
      '-f ${fromFormat} --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -s -o "${outputPath}" -t textile',
    extension: '.textile',
  },
  'OPML': {
    name: 'OPML',
    type: 'pandoc',
    arguments: '-f ${fromFormat} --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" -s -o "${outputPath}" -t opml',
    extension: '.opml',
  },
  'Bibliography (.bib)': {
    name: 'Bibliography',
    type: 'pandoc',
    arguments:
      '-f ${fromFormat} --resource-path="${currentDir}" --resource-path="${attachmentFolderPath}" --lua-filter="${luaDir}/citefilter.lua" -o "${outputPath}" --to=bibtex "${currentPath}"',
    extension: '.bib',
  },
  'Custom': {
    name: 'Custom',
    type: 'custom',
    command: 'your command',
    targetFileExtensions: '.ext',
  },
} satisfies Record<string, ExportSetting> as Record<string, ExportSetting>;
