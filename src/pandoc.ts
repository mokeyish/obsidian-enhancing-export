import { exec } from './utils';
import semver from 'semver/preload';
import type { SemVer } from 'semver';

export const normalizePandocPath = (path?: string) => (path?.includes(' ') ? `"${path}"` : `${path ?? 'pandoc'}`);

export async function getPandocVersion(path?: string, env?: Record<string, string>): Promise<SemVer> {
  path = normalizePandocPath(path);
  let version = await exec(`${path} --version`, { env });
  version = version.substring(0, version.indexOf('\n')).replace('pandoc.exe', '').replace('pandoc', '').trim();
  let dotCount = [...version].filter(c => c === '.').length;
  while (dotCount > 2) {
    version = version.substring(0, version.lastIndexOf('.'));
    dotCount -= 1;
  }
  return semver.parse(version);
}
