import { platform } from 'process';
import export_templates from './export_templates';
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
export interface Variables {
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
}

export type PlatformValue<T> = { [k in typeof platform]?: T };

export function setPlatformValue<T>(obj: { [k in typeof platform]?: T }, value: T): { [k in typeof platform]?: T } {
  if (typeof value === 'string' && value.trim() === '') {
    value = undefined;
  }
  return {
    ...(obj ?? {}),
    [platform]: value,
  };
}

export function getPlatformValue<T>(obj: { [k in typeof platform]?: T }): T {
  return (obj ?? {})[platform];
}

export interface UniversalExportPluginSettings {
  version?: string;
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
  lastExportTemplate?: string;

}

interface CommonExportSetting {
  name: string;

  openExportedFileLocation?: boolean; // open exported file location after export
  openExportedFile?: boolean; // open exported file after export
  optionsMeta?: PropertyGridMeta;
  env?: Record<string, string>
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

export const DEFAULT_SETTINGS: UniversalExportPluginSettings = {
  items: Object.values(export_templates).filter(o => o.type !== 'custom'),
  pandocPath: undefined,
  defaultExportDirectoryMode: 'Auto',
  openExportedFile: true,
};

export function extractDefaultExtension(s: ExportSetting): string {
  if (s.type === 'pandoc') {
    return s.extension;
  } else if (s.type === 'custom') {
    return s.targetFileExtensions?.split(',')[0];
  }
  return '';
}
