import { platform } from 'process';


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


export interface Variables {
  pluginDir: string,
  outputDir: string,
  outputPath: string,
  outputFileName: string,
  outputFileFullName: string,
  currentDir: string,
  currentPath: string,
  currentFileName: string,
  currentFileFullName: string,
  // date: new Date(currentFile.stat.ctime),
  // lastMod: new Date(currentFile.stat.mtime),
  // now: new Date()
}

export type PlatformValue<T>= { [k in typeof platform]?: T };

export function setPlatformValue<T>(obj: { [k in typeof platform]?: T }, value: T): { [k in typeof platform]?: T } {
  if (typeof value === 'string' && value.trim() === '') {
    value = undefined;
  }
  return {
    ...(obj ?? {}),
    [platform]: value
  };
}

export function getPlatformValue<T>(obj: { [k in typeof platform]?: T }): T {
  return (obj ?? {})[platform];
}

export interface UniversalExportPluginSettings {
  pandocPath?: PlatformValue<string>;
  showOverwriteConfirmation?: boolean;
  defaultExportDirectoryMode: 'Auto' | 'Same' | 'Custom';
  customDefaultExportDirectory?: PlatformValue<string>;
  lastEditName?: string;
  items: ExportSetting[];

  openExportedFile?: boolean; // open exported file after export
  openExportedFileLocation?: boolean; // open exported file location after export


  lastExportDirectory?: PlatformValue<string>;
  lastExportType?: string;
}




interface CommonExportSetting {
  name: string;
  
  openExportedFileLocation?: boolean; // open exported file location after export
  openExportedFile?: boolean; // open exported file after export
}

export interface PandocExportSetting extends CommonExportSetting{
  type: 'pandoc';
  arguments: string;
  customArguments?: string;
  extension: string;

  runCommand?: boolean; // run command after export
  command?: string;     // command to run after export
}

export interface CustomExportSetting extends CommonExportSetting{
  type: 'custom';
  command: string;
  targetFileExtensions?: string,

  showCommandOutput?: boolean;  // show command output in console after export
}

export type ExportSetting = PandocExportSetting | CustomExportSetting;


export const templates: Record<string, ExportSetting> = {
  'Markdown': {
    name: 'Markdown',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" --lua-filter="${pluginDir}/lua/markdown.lua" -s -o "${outputPath}" -t commonmark_x-attributes',
    extension: '.md'
  },
  'Markdown (Hugo)': {
    name: 'Markdown (Hugo)',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" --lua-filter="${pluginDir}/lua/markdown+hugo.lua" -s -o "${outputPath}" -t commonmark_x-attributes',
    extension: '.md'
  },
  'Html': {
    name: 'Html',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" --self-contained --metadata title="${currentFileName}" -s -o "${outputPath}" -t html',
    customArguments: '--mathjax="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg-full.js"',
    extension: '.html'
  }, 
  'PDF': {
    name: 'PDF',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" --self-contained --metadata title="${currentFileName}" -s -o "${outputPath}" -t pdf',
    extension: '.pdf'
  },
  'Word (.docx)': {
    name: 'Word (.docx)',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t docx',
    extension: '.docx'
  },
  'OpenOffice': {
    name: 'OpenOffice',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t odt',
    extension: '.odt'
  },
  'RTF': {
    name: 'RTF',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t rtf',
    extension: '.rtf'
  },
  'Epub': {
    name: 'Epub',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t epub',
    extension: '.epub'
  },
  'Latex': {
    name: 'Latex',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t latex',
    extension: '.latex'
  },
  'Media Wiki': {
    name: 'Media Wiki',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t mediawiki',
    extension: '.mediawiki'
  },
  'reStructuredText': {
    name: 'reStructuredText',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t rst',
    extension: '.rst'
  },
  'Textile': {
    name: 'Textile',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t textile',
    extension: '.textile'
  },
  'OPML': {
    name: 'OPML',
    type: 'pandoc',
    arguments: '-f markdown --resource-path="${currentDir}" -s -o "${outputPath}" -t opml',
    extension: '.opml'
  },  
  'Custom': {
    name: 'Custom',
    type: 'custom',
    command: 'your command',
  },
};

export const DEFAULT_SETTINGS: UniversalExportPluginSettings = {
  items: Object.values(templates).filter(o => o.type !== 'custom'),
  pandocPath: undefined,
  defaultExportDirectoryMode: 'Auto',
  openExportedFile: true
};


export function extractDefaultExtension(s: ExportSetting): string {
  if (s.type === 'pandoc') {
    return s.extension;
  } else if (s.type === 'custom') {
    return s.targetFileExtensions?.split(',')[0];
  }
  return '';
}
