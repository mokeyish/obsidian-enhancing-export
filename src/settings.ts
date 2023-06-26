import export_templates from './export_templates';
import { setPlatformValue, PlatformValue, renderTemplate, getPlatformValue } from './utils';
import type { PropertyGridMeta } from './ui/components/PropertyGrid';

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
export interface Variables extends Record<string, unknown> {
  attachmentFolderPath: string;
  pluginDir: string;
  luaDir: string;
  outputDir: string;
  outputPath: string;
  outputFileName: string;
  outputFileFullName: string;
  currentDir: string;
  currentPath: string;
  currentFileName: string;
  currentFileFullName: string;
  vaultDir: string;
  // date: new Date(currentFile.stat.ctime),
  // lastMod: new Date(currentFile.stat.mtime),
  // now: new Date()
  metadata?: unknown;
  options?: unknown;
  env?: Record<string, string>;
}

export interface UniversalExportPluginSettings {
  version?: string;
  pandocPath?: PlatformValue<string>;
  showOverwriteConfirmation?: boolean;
  defaultExportDirectoryMode: 'Auto' | 'Same' | 'Custom';
  customDefaultExportDirectory?: PlatformValue<string>;
  env: PlatformValue<Record<string, string>>;
  items: ExportSetting[];

  openExportedFile?: boolean; // open exported file after export
  openExportedFileLocation?: boolean; // open exported file location after export

  lastEditName?: string;

  lastExportDirectory?: PlatformValue<string>;
  lastExportType?: string;
}

interface CommonExportSetting {
  name: string;

  openExportedFileLocation?: boolean; // open exported file location after export
  openExportedFile?: boolean; // open exported file after export
  optionsMeta?: PropertyGridMeta;
}

export interface PandocExportSetting extends CommonExportSetting {
  type: 'pandoc';
  arguments: string;
  customArguments?: string;
  extension: string;

  runCommand?: boolean; // run command after export
  command?: string; // command to run after export
}

export interface CustomExportSetting extends CommonExportSetting {
  type: 'custom';
  command: string;
  targetFileExtensions?: string;

  showCommandOutput?: boolean; // show command output in console after export
}

export type ExportSetting = PandocExportSetting | CustomExportSetting;

const createDefaultEnv = () => {
  let env: PlatformValue<Record<string, string>> = {};
  env = setPlatformValue(
    env,
    {
      'HOME': '${HOME}',
    },
    '*' // available for all platforms.
  );

  env = setPlatformValue(
    env,
    {
      'PATH': '/usr/local/bin:/Library/TeX/texbin:${PATH}', // Add HomebrewBin and TexBin
      'TEXINPUTS': '${pluginDir}/textemplate/:', // It is necessary to **append** to the current TEXINPUTS wtih ":" - NOT REPLACE. TEXINPUTS contains the basic latex classes.
    },
    'darwin' // for MacOS only.
  );

  return env;
};

export const DEFAULT_ENV = createDefaultEnv();

export const DEFAULT_SETTINGS: UniversalExportPluginSettings = {
  items: Object.values(export_templates).filter(o => o.type !== 'custom'),
  pandocPath: undefined,
  defaultExportDirectoryMode: 'Auto',
  openExportedFile: true,
  env: DEFAULT_ENV,
};

export function extractDefaultExtension(s: ExportSetting): string {
  if (s.type === 'pandoc') {
    return s.extension;
  } else if (s.type === 'custom') {
    return s.targetFileExtensions?.split(',')[0];
  }
  return '';
}

export function createEnv(env: Record<string, string>, envVars?: Record<string, unknown>) {
  env = Object.assign({}, getPlatformValue(DEFAULT_ENV), env);
  envVars = Object.assign({ HOME: process.env['HOME'] ?? process.env['USERPROFILE'] }, process.env, envVars ?? {});
  return Object.fromEntries(Object.entries(env).map(([n, v]) => [n, renderTemplate(v, envVars)]));
}
