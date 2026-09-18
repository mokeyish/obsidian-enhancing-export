import export_templates from './export_templates';
import { setPlatformValue, PlatformValue, renderTemplate, getPlatformValue } from './utils';
import { buildPath } from './shellenv';
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
  embedDirs: string;
  options?: unknown;
  env?: Record<string, string>;
}

export interface DocumentInfo {
  title?: string;
  author?: string;
  institute?: string;
  date?: string;
  keywords?: string;
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

  /** Paper metadata the user filled in the export dialog, reused as defaults. */
  lastDocumentInfo?: DocumentInfo;

  showExportProgressBar?: boolean;

  // Multilingual font fallback. When enabled (the default), export templates
  // that do not configure fonts automatically fall back to fonts available on
  // the current machine, for every writing system found in the document.
  enableFontFallback?: boolean;
  fallbackFonts?: string;

  // Render mermaid / plantuml / graphviz code blocks into images.
  renderDiagrams?: boolean;
  diagramScale?: number;
  mmdcPath?: PlatformValue<string>;
  plantumlPath?: PlatformValue<string>;
  dotPath?: PlatformValue<string>;
}

export type OptionsMeta = {
  [optionsName: string]: PropertyGridMeta[string] | `preset:${keyof typeof PRESET_OPTIONS_META}`;
};

interface CommonExportSetting {
  name: string;

  openExportedFileLocation?: boolean; // open exported file location after export
  openExportedFile?: boolean; // open exported file after export
  optionsMeta?: OptionsMeta;
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

export const PRESET_OPTIONS_META: PropertyGridMeta = {
  'textemplate': {
    title: 'Latex Template',
    type: 'dropdown',
    options: [
      { name: 'None', value: null },
      { name: 'Chinese Thesis', value: 'chinese-thesis.tex' },
      { name: 'IEEE', value: 'ieee.tex' },
      { name: 'LNCS', value: 'lncs.tex' },
      { name: 'NeurIPS', value: 'neurips.tex' },
    ],
  },
};

export const DEFAULT_ENV = (() => {
  let env: PlatformValue<Record<string, string>> = {};
  env = setPlatformValue(
    env,
    {
      'HOME': '${HOME}',
      'PATH': '${PATH}',
      'TEXINPUTS': '${pluginDir}/textemplate/:', // It is necessary to **append** to the current TEXINPUTS wtih ":" - NOT REPLACE. TEXINPUTS contains the basic latex classes.
    },
    '*' // available for all platforms.
  );

  env = setPlatformValue(
    env,
    {
      'TEXINPUTS': '${pluginDir}/textemplate/;', // Windows uses ; rather than : for appending
      'PATH': '${HOME}\\AppData\\Local\\Pandoc;${PATH}',
    },
    'win32' // available for windows only.
  );

  // macOS / Linux: the real PATH is resolved from the login shell at runtime
  // (see src/shellenv.ts) instead of hard coding installation directories.

  return env;
})();

export const DEFAULT_SETTINGS: UniversalExportPluginSettings = {
  items: Object.values(export_templates).filter(o => o.type !== 'custom'),
  pandocPath: undefined,
  defaultExportDirectoryMode: 'Auto',
  openExportedFile: true,
  env: DEFAULT_ENV,
  showExportProgressBar: true,
  enableFontFallback: true,
  renderDiagrams: true,
  diagramScale: 3,
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
  // PATH from the login shell (resolved at load time) + process PATH + fallbacks,
  // so pandoc / xelatex / mmdc are found even when Obsidian was started from the GUI.
  const resolvedPath = buildPath(process.env['PATH']);
  envVars = Object.assign({ HOME: process.env['HOME'] ?? process.env['USERPROFILE'] }, process.env, { PATH: resolvedPath }, envVars ?? {});
  // Ensure the locale is set: without LANG, UTF-8 text (Chinese etc.) passed
  // through --metadata or the command line becomes mojibake.
  if (!env['LANG'] && !env['LC_ALL']) {
    env['LANG'] = process.env['LANG'] ?? 'en_US.UTF-8';
  }
  return Object.fromEntries(Object.entries(env).map(([n, v]) => [n, renderTemplate(v, envVars)]));
}

export function finalizeOptionsMeta(meta?: OptionsMeta): PropertyGridMeta {
  if (meta) {
    return Object.fromEntries(
      Object.entries(meta).map(([optionsName, optionsMetaOrPresetName]) => [
        optionsName,
        typeof optionsMetaOrPresetName === 'string'
          ? PRESET_OPTIONS_META[optionsMetaOrPresetName.startsWith('preset:') ? optionsMetaOrPresetName.substring(7) : '']
          : optionsMetaOrPresetName,
      ])
    );
  }
  return {};
}
