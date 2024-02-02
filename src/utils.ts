import { ExecOptions, exec as node_exec } from 'child_process';
import process from 'process';

export type PlatformKey = typeof process.platform | '*';

export type PlatformValue<T> = { [k in PlatformKey]?: T };

export function setPlatformValue<T>(obj: PlatformValue<T>, value: T, platform?: PlatformKey | PlatformKey[]): PlatformValue<T> {
  if (typeof value === 'string' && value.trim() === '') {
    value = undefined;
  }

  if (platform instanceof Array) {
    return platform.reduce((o, p) => setPlatformValue(o, value, p), obj);
  }

  platform ??= process.platform;

  return {
    ...(obj ?? {}),
    [platform]: value,
  };
}

export function getPlatformValue<T>(obj: PlatformValue<T>, platform?: PlatformKey): T {
  obj ??= {};
  const val = obj[platform ?? process.platform];
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
        console.error(stdout, error);
        return;
      }
      if (stderr && stderr !== '') {
        reject(stderr);
        console.error(stdout, error);
        return;
      }
      if (stdout?.trim().length === 0 && '1' === localStorage.getItem('debug-plugin')) {
        console.log(stdout);
      }
      resolve(stdout);
    });
  });
}

export function joinEnvPath(...paths: string[]) {
  switch (process.platform) {
    case 'win32':
      return paths.join(';');
    default:
      return paths.join(':');
  }
}

export function trimQuotes(s: string) {
  return (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")) ? s.substring(1, s.length - 1) : s;
}

/**
 * render template
 * @example
 * renderTemplate('Hi, ${name}', { name: 'John' }) // returns 'Hi, John'
 * @param template
 * @param variables
 * @returns {string}
 */
export function renderTemplate(template: string, variables: Record<string, unknown> = {}): string {
  while (true) {
    try {
      const keys = Object.keys(variables).filter(isVarName) as Array<keyof typeof variables>;
      const values = keys.map(k => variables[k]);
      return new Function(...keys, `{ return \`${template.replaceAll('\\', '\\\\')}\` }`).bind(variables)(...values);
    } catch (e: unknown) {
      if (e instanceof ReferenceError && e.message.endsWith('is not defined')) {
        const name = e.message.substring(0, e.message.indexOf(' '));
        const value =
          Object.keys(variables)
            .filter(n => n.toLowerCase() === name.toLowerCase())
            .map(n => variables[n])[0] ?? `\${${name}}`;
        variables[name] = value;
      } else {
        throw e;
      }
    }
  }
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
