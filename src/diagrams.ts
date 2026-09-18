/*
 * Diagram support (Mermaid / PlantUML / Graphviz).
 *
 * The actual rendering is performed by lua/diagrams.lua. This module only
 * resolves the external tools, writes a beautified Mermaid configuration and
 * prepares the variables that are handed to Pandoc.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import process from 'process';
import { getPlatformValue, PlatformValue } from './utils';

export interface DiagramPreferences {
  renderDiagrams?: boolean;
  mmdcPath?: PlatformValue<string>;
  plantumlPath?: PlatformValue<string>;
  dotPath?: PlatformValue<string>;
  diagramScale?: number;
}

export interface DiagramContext {
  enabled: boolean;
  /** Temporary render directory (safe ASCII path, full permissions). */
  renderDir: string;
  /** Whether the output format requires images to persist next to the output. */
  needsLocalImages: boolean;
  variables: Record<string, string>;
}

/** Formats for which rendering diagram code blocks makes sense. */
const UNSUPPORTED_EXTENSIONS = new Set(['.bib', '.opml']);

export function supportsDiagrams(extension: string): boolean {
  return !UNSUPPORTED_EXTENSIONS.has(extension);
}

const home = process.env['HOME'] ?? process.env['USERPROFILE'] ?? '';

const BIN_DIRS = [
  path.join(home, '.npm-global', 'bin'),
  path.join(home, '.local', 'bin'),
  path.join(home, 'bin'),
  '/opt/homebrew/bin',
  '/usr/local/bin',
  '/opt/local/bin',
  '/usr/bin',
];

function findExecutable(name: string, override?: string): string {
  if (override && override.trim() !== '') {
    return override.trim();
  }
  for (const dir of BIN_DIRS) {
    const candidate = path.join(dir, name);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return name;
}

export interface PlantumlCommand {
  command: string;
  isJar: boolean;
}

export function resolvePlantuml(override?: string): PlantumlCommand {
  if (override && override.trim() !== '') {
    const value = override.trim();
    return { command: value, isJar: value.toLowerCase().endsWith('.jar') };
  }
  const executable = findExecutable('plantuml');
  if (executable !== 'plantuml') {
    return { command: executable, isJar: false };
  }
  const jarCandidates = [
    '/opt/homebrew/opt/plantuml/libexec/plantuml.jar',
    '/usr/local/opt/plantuml/libexec/plantuml.jar',
    '/opt/local/share/plantuml/plantuml.jar',
    path.join(home, 'plantuml.jar'),
  ];
  for (const jar of jarCandidates) {
    if (fs.existsSync(jar)) {
      return { command: jar, isJar: true };
    }
  }
  return { command: 'plantuml', isJar: false };
}

function tmpDir(): string {
  const dir = path.join(os.tmpdir(), 'obsidian-enhancing-export');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** File where lua/diagrams.lua records diagrams it could not render. */
export function diagramErrorLogPath(): string {
  return path.join(tmpDir(), 'diagram-errors.log');
}

/** Read the diagram error log (cleared at the start of the next export). */
export function consumeDiagramErrors(): string | undefined {
  const file = diagramErrorLogPath();
  try {
    if (!fs.existsSync(file)) {
      return undefined;
    }
    const content = fs.readFileSync(file, 'utf-8').trim();
    return content || undefined;
  } catch {
    return undefined;
  }
}

const MERMAID_FONT_STACK = ['PingFang SC', 'Songti SC', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Source Han Sans SC', 'sans-serif'];

function writeMermaidConfig(): string {
  const config = {
    theme: 'base',
    themeVariables: {
      fontFamily: MERMAID_FONT_STACK.map(f => (f.includes(' ') ? `"${f}"` : f)).join(', '),
      fontSize: '16px',
      primaryColor: '#eef2ff',
      primaryTextColor: '#1e1b4b',
      primaryBorderColor: '#6366f1',
      lineColor: '#64748b',
      secondaryColor: '#f8fafc',
      tertiaryColor: '#f1f5f9',
      clusterBkg: '#f8fafc',
      clusterBorder: '#cbd5e1',
      edgeLabelBackground: '#ffffff',
      actorBkg: '#eef2ff',
      actorBorder: '#6366f1',
      noteBkgColor: '#fef9c3',
      noteBorderColor: '#eab308',
    },
    flowchart: { curve: 'basis', htmlLabels: true, padding: 12, nodeSpacing: 45, rankSpacing: 45, useMaxWidth: false },
    sequence: { useMaxWidth: false, wrap: true, mirrorActors: false },
    state: { useMaxWidth: false },
    class: { useMaxWidth: false },
    er: { useMaxWidth: false },
    gantt: { useMaxWidth: false, fontSize: 14 },
    securityLevel: 'loose',
  };
  const file = path.join(tmpDir(), 'mermaid-config.json');
  fs.writeFileSync(file, JSON.stringify(config, null, 2), 'utf-8');
  return file;
}

/** Formats whose output references image files by path (images must persist). */
const TEXT_FORMAT_EXTENSIONS = new Set(['.md', '.tex', '.mediawiki', '.rst', '.textile', '.opml']);

export function needsLocalImages(extension: string): boolean {
  return TEXT_FORMAT_EXTENSIONS.has(extension);
}

/**
 * Prepare the Pandoc variables and a temporary render directory for diagrams.lua.
 * The directory uses a safe ASCII path in the OS temp directory, so the
 * pandoc→mmdc chain never hits TCC-protected vault paths.
 */
export function prepareDiagrams(preferences: DiagramPreferences, outputPath: string, luaDir: string): DiagramContext | undefined {
  if (preferences.renderDiagrams === false) {
    return undefined;
  }

  // Render to a safe ASCII temp directory — the pandoc→mmdc subprocess chain
  // has full permissions there and the path never contains CJK characters.
  const renderDir = path.join(tmpDir(), `render-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  fs.mkdirSync(renderDir, { recursive: true });
  // Clear stale errors from a previous export so the Notice only shows real failures.
  fs.rmSync(diagramErrorLogPath(), { force: true });

  const plantuml = resolvePlantuml(getPlatformValue(preferences.plantumlPath));
  const scale = preferences.diagramScale && preferences.diagramScale > 0 ? preferences.diagramScale : 3;
  const extension = path.extname(outputPath).toLowerCase();

  const normalize = (value: string) => (process.platform === 'win32' ? value.replaceAll('\\', '/') : value);

  return {
    enabled: true,
    renderDir: normalize(renderDir),
    needsLocalImages: needsLocalImages(extension),
    variables: {
      oee_diagram_enable: '1',
      oee_diagram_media: normalize(renderDir),
      oee_diagram_mmdc: normalize(findExecutable('mmdc', getPlatformValue(preferences.mmdcPath))),
      oee_diagram_plantuml: normalize(plantuml.command),
      oee_diagram_plantuml_jar: plantuml.isJar ? '1' : '0',
      oee_diagram_dot: normalize(findExecutable('dot', getPlatformValue(preferences.dotPath))),
      oee_diagram_config: normalize(writeMermaidConfig()),
      oee_diagram_scale: String(scale),
      oee_diagram_filter: normalize(path.join(luaDir, 'diagrams.lua')),
    },
  };
}

/** Copy rendered images from the temp dir to the output dir, then clean up. */
export function finalizeDiagrams(context: DiagramContext, outputPath: string): void {
  try {
    if (context.needsLocalImages) {
      const outputDir = path.dirname(outputPath);
      const isTextBundle = /[\\/]([^\\/]+)\.textbundle[\\/]/.test(outputPath);
      const localDir = isTextBundle
        ? path.join(path.dirname(outputDir), path.basename(outputDir), 'assets')
        : path.join(outputDir, 'diagrams-media');
      fs.mkdirSync(localDir, { recursive: true });
      for (const file of fs.readdirSync(context.renderDir)) {
        fs.copyFileSync(path.join(context.renderDir, file), path.join(localDir, file));
      }
    }
  } finally {
    fs.rmSync(context.renderDir, { recursive: true, force: true });
  }
}
