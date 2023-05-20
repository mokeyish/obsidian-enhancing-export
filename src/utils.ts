import { ExecOptions, exec as node_exec } from 'child_process';

export const env: { [k: string]: string; HOME?: string; PATH?: string } = {};

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

// noinspection SpellCheckingInspection
export const nameofFactory =
  <T>() =>
    (name: keyof T) =>
      name;

export function exec(cmd: string, options?: ExecOptions): Promise<string> {
  options = options ?? {};
  if (!options.env && Object.keys(env).length > 0) {
    options.env = env;
  }

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
