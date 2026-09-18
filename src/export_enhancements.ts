/*
 * Extra Pandoc arguments injected by the plugin at export time:
 *  - multilingual font fallback for PDF / LaTeX / HTML / epub
 *  - mermaid / plantuml / graphviz rendering
 *
 * Keeping this out of the user editable command templates means it also applies
 * when the template is "None" and does not get lost when a template is edited.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import process from 'process';
import { ExportSetting, extractDefaultExtension, UniversalExportPluginSettings } from './settings';
import { buildFontHeader, buildFontStyle, detectScripts, FontOptions } from './fonts';
import { prepareDiagrams, supportsDiagrams, DiagramContext } from './diagrams';
import type { DocumentInfo } from './settings';

export interface EnhancementOptions {
  setting: ExportSetting;
  settings: UniversalExportPluginSettings;
  outputPath: string;
  currentPath: string;
  pluginDir: string;
  luaDir: string;
  metadata?: unknown;
  /** Paper info filled in the export dialog (overrides front matter). */
  documentInfo?: DocumentInfo;
  combinedArguments: string;
}

function tmpDir(): string {
  const dir = path.join(os.tmpdir(), 'obsidian-enhancing-export');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function normalize(p: string): string {
  return process.platform === 'win32' ? p.replaceAll('\\', '/') : p;
}

const quote = (value: string) => `"${value.replaceAll('"', '')}"`;

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }
  return undefined;
}

function detectPdfEngine(args: string): string | undefined {
  const match = args.match(/--pdf-engine[=\s]+("?)([^\s"]+)\1/);
  return match?.[2]?.toLowerCase();
}

function readDocumentText(filePath: string): string | undefined {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return undefined;
  }
}

function fontOptions(options: EnhancementOptions): FontOptions {
  const extraFonts = (options.settings.fallbackFonts ?? '')
    .split(/[,，;]/)
    .map(font => font.trim())
    .filter(Boolean);
  return {
    metadata: (options.metadata ?? {}) as Record<string, unknown>,
    extraFonts,
  };
}

function documentScripts(options: EnhancementOptions, documentText?: string): ReturnType<typeof detectScripts> {
  // Scripts are detected from the document itself (front matter `lang` + body
  // text scan) AND from the paper info typed in the export dialog, so a
  // Chinese title on an otherwise English document still gets a CJK font.
  const metadata = (options.metadata ?? {}) as Record<string, unknown>;
  const info = options.documentInfo;
  const extra = [asString(metadata['lang']), info?.title, info?.author, info?.institute, info?.keywords].filter(Boolean).join(' ');
  return detectScripts([documentText, extra].filter(Boolean).join('\n'), asString(metadata['lang']));
}

function fontFallbackArguments(options: EnhancementOptions, extension: string, documentText?: string): string[] {
  const { settings } = options;
  if (settings.enableFontFallback === false) {
    return [];
  }

  const scripts = documentScripts(options, documentText);
  const fonts = fontOptions(options);

  if (extension === '.pdf' || extension === '.tex') {
    const engine = detectPdfEngine(options.combinedArguments);
    // pdflatex cannot embed OpenType fonts, silently skip it.
    if (engine && !['xelatex', 'lualatex', 'tectonic'].includes(engine)) {
      return [];
    }
    const header = buildFontHeader(scripts, fonts);
    if (!header) {
      return [];
    }
    const file = path.join(tmpDir(), 'font-fallback.tex');
    fs.writeFileSync(file, header, 'utf-8');
    return [`--include-in-header=${quote(normalize(file))}`];
  }

  if (extension === '.html' || extension === '.epub') {
    const style = buildFontStyle(scripts, fonts);
    if (!style) {
      return [];
    }
    if (extension === '.html') {
      const file = path.join(tmpDir(), 'font-fallback.html');
      fs.writeFileSync(file, `<style>\n${style}</style>\n`, 'utf-8');
      return [`--include-in-header=${quote(normalize(file))}`];
    }
    const file = path.join(tmpDir(), 'font-fallback.css');
    fs.writeFileSync(file, style, 'utf-8');
    return [`--css=${quote(normalize(file))}`];
  }

  return [];
}

function diagramArguments(options: EnhancementOptions, extension: string): string[] {
  const context = prepareDiagramContext(options, extension);
  return diagramArgumentsFromContext(context);
}

function prepareDiagramContext(options: EnhancementOptions, extension: string): DiagramContext | undefined {
  const { settings } = options;
  if (settings.renderDiagrams === false || !supportsDiagrams(extension)) {
    return undefined;
  }
  return prepareDiagrams(settings, options.outputPath, options.luaDir);
}

function diagramArgumentsFromContext(context: DiagramContext | undefined): string[] {
  if (!context?.enabled) {
    return [];
  }
  const args = [`--lua-filter=${quote(context.variables.oee_diagram_filter)}`];
  for (const [key, value] of Object.entries(context.variables)) {
    if (key === 'oee_diagram_filter') {
      continue;
    }
    args.push(`-V ${key}=${quote(value)}`);
  }
  return args;
}

export interface EnhancementResult {
  arguments: string;
  diagramContext?: DiagramContext;
}

/** Build the extra arguments appended to a pandoc export command. */
export function buildEnhancementArguments(options: EnhancementOptions): string {
  if (options.setting.type !== 'pandoc') {
    return '';
  }
  const extension = extractDefaultExtension(options.setting);
  const args = [...fontFallbackArguments(options, extension, documentText), ...diagramArguments(options, extension)];
  return args.filter(Boolean).join(' ');
}

/** Same as buildEnhancementArguments, but also returns the diagram context. */
export function buildEnhancement(options: EnhancementOptions): EnhancementResult {
  if (options.setting.type !== 'pandoc') {
    return { arguments: '' };
  }
  const extension = extractDefaultExtension(options.setting);
  const documentText = readDocumentText(options.currentPath);
  const fontArgs = fontFallbackArguments(options, extension, documentText);
  const context = prepareDiagramContext(options, extension);
  const args = [...fontArgs, ...diagramArgumentsFromContext(context)];
  return {
    arguments: args.filter(Boolean).join(' '),
    diagramContext: context,
  };
}
