import { exec } from './utils';
import semver from 'semver/preload';

export const normalizePandocPath = (path?: string) => (path?.includes(' ') ? `"${path}"` : `${path ?? 'pandoc'}`);

export async function getPandocVersion(path?: string, env?: Record<string, string>) {
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

export const PANDOC_REQUIRED_VERSION = '3.1.7';

export default {
  normalizePath: normalizePandocPath,
  getVersion: getPandocVersion,
  requiredVersion: PANDOC_REQUIRED_VERSION,
};
