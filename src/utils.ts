import { ExecOptions, exec as node_exec } from 'child_process';
import process from 'process';

export type PlatformKey = typeof process.platform | '*';

export type PlatformValue<T> = { [k in PlatformKey]?: T };

export function setPlatformValue<T>(obj: PlatformValue<T>, value: T, platform?: keyof PlatformValue<T>): PlatformValue<T> {
  if (typeof value === 'string' && value.trim() === '') {
    value = undefined;
  }
  platform ??= process.platform;
  return {
    ...(obj ?? {}),
    [platform]: value,
  };
}

export function getPlatformValue<T>(obj: PlatformValue<T>): T {
  obj ??= {};
  const val = obj[process.platform];
  const all = obj['*'];
  if (all && typeof all === 'object') {
    return Object.assign({}, all, val);
  }
  return val ?? all;
}

// eslint-disable-next-line
export function strTpl(strings: TemplateStringsArray, ...keys: number[]): (...values: any[]) => string {
  return function (...values) {
    const dict = values[values.length - 1] || {};
    const result = [strings[0]];
    keys.forEach(function (key, i) {
      const value = Number.isInteger(key) ? values[key] : dict[key];
      result.push(value, strings[i + 1]);
    });
    return result.join('');
  };
}

export function exec(cmd: string, options?: ExecOptions): Promise<string> {
  options = options ?? {};
  return new Promise((resolve, reject) => {
    node_exec(cmd, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr && stderr !== '') {
        reject(stderr);
        return;
      }
      resolve(stdout);
    });
  });
}

export function createEnv(env: Record<string, string>, envVars?: object) {
  envVars = Object.assign({ HOME: process.env['HOME'] ?? process.env['USERPROFILE'] }, process.env, envVars ?? {});
  return Object.fromEntries(Object.entries(env).map(([n, v]) => [n, renderTemplate(v, envVars)]));
}

export function joinEnvPath(...paths: string[]) {
  switch (process.platform) {
    case 'win32':
      return paths.join(';');
    default:
      return paths.join(':');
  }
}

/**
 * render template
 * @example
 * renderTemplate('Hi, ${name}', { name: 'John' }) // returns 'Hi, John'
 * @param template
 * @param variables
 * @returns {string}
 */
export function renderTemplate(template: string, variables: object = {}): string {
  const keys = Object.keys(variables).filter(isVarName) as Array<keyof typeof variables>;
  const values = keys.map(k => variables[k]);
  return new Function(...keys, `{ return \`${template.replaceAll('\\', '\\\\')}\` }`).bind(variables)(...values);
}

const isVarName = (str: string) => {
  if (typeof str !== 'string') {
    return false;
  }

  if (str.trim() !== str) {
    return false;
  }

  try {
    new Function(str, 'var ' + str);
  } catch {
    return false;
  }
  return true;
};
