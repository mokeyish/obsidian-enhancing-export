/*
 * Resolve the user's real PATH.
 *
 * Obsidian launched from the macOS Finder (or a Linux .desktop file) inherits a
 * minimal environment, so tools installed through Homebrew, MacPorts, pyenv,
 * nvm, … are invisible even though they work in a terminal.
 *
 * Instead of hard coding installation directories, we ask the user's login
 * shell for its PATH once per session and merge it with the process PATH and a
 * few well known fallbacks. This is the same approach editors like VS Code use
 * ("resolve shell environment").
 */

import { execFile } from 'child_process';
import * as fs from 'fs';
import process from 'process';

const isWindows = process.platform === 'win32';
const delimiter = isWindows ? ';' : ':';

let cachedShellPath: string | undefined;
let shellPathResolved = false;

/** Last resort directories, only used when the login shell cannot be queried. */
const FALLBACK_BINS: Record<string, string[]> = {
  darwin: ['/opt/homebrew/bin', '/opt/local/bin', '/usr/local/bin', '/Library/TeX/texbin'],
  linux: ['/usr/local/bin', '/usr/bin', '/snap/bin', '/home/linuxbrew/.linuxbrew/bin'],
  win32: [],
};

function uniquePaths(paths: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of paths) {
    if (entry && !seen.has(entry)) {
      seen.add(entry);
      result.push(entry);
    }
  }
  return result;
}

function splitPaths(value?: string): string[] {
  return value ? value.split(delimiter).filter(Boolean) : [];
}

function runShell(shell: string, flag: string): Promise<string | undefined> {
  return new Promise(resolve => {
    execFile(
      shell,
      [flag, 'printf "__OEE_PATH__%s__OEE_PATH__" "$PATH"'],
      { timeout: 2000, maxBuffer: 1 << 20, env: process.env },
      (_error, stdout) => {
        const match = stdout?.match(/__OEE_PATH__([\s\S]*?)__OEE_PATH__/);
        resolve(match?.[1]?.trim() || undefined);
      }
    );
  });
}

/**
 * Query the login shell for the user's PATH. Cached for the session.
 * Returns undefined when the shell cannot be queried (e.g. Windows).
 *
 * At most two shells are tried and every attempt is time boxed, so plugin
 * startup cannot be delayed by a misbehaving shell profile.
 */
export async function resolveLoginShellPath(): Promise<string | undefined> {
  if (shellPathResolved) {
    return cachedShellPath;
  }
  shellPathResolved = true;

  if (isWindows) {
    return undefined;
  }

  const shells = [...new Set([process.env.SHELL, '/bin/zsh', '/bin/bash'].filter(Boolean) as string[])].slice(0, 2);
  for (const shell of shells) {
    if (!fs.existsSync(shell)) {
      continue;
    }
    // Interactive login shells pick up the most configuration (e.g. nvm),
    // non-interactive login shells are the faster fallback.
    for (const flag of ['-ilc', '-lc']) {
      const path = await runShell(shell, flag);
      if (path) {
        cachedShellPath = path;
        return path;
      }
    }
  }
  return undefined;
}

/** The PATH resolved from the login shell, if any. */
export function getLoginShellPath(): string | undefined {
  return cachedShellPath;
}

/**
 * Build the PATH used when spawning pandoc and friends: login shell PATH first,
 * then the current process PATH, then fallback directories.
 */
export function buildPath(processPath?: string): string {
  const fallbacks = FALLBACK_BINS[process.platform] ?? [];
  return uniquePaths([...splitPaths(cachedShellPath), ...splitPaths(processPath), ...fallbacks]).join(delimiter);
}
