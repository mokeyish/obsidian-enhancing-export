import { ExecOptions, exec as node_exec } from 'child_process';
import { platform } from 'process';

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

export function exec(cmd: string, options?: ExecOptions): Promise<string> {
  options = options ?? {};

  if (Object.keys(env).length > 0) {
    if (!options.env) {
      options.env = env;
    } else {
      for (const [name, value] of Object.entries(env)) {
        if (options.env[name]) {
          if (name.toUpperCase() === 'PATH') {
            options.env[name] = joinEnvPath(options.env[name], value);
            continue;
          }
        }
        options.env[name] = value;
      }
    }
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

export function joinEnvPath(...paths: string[]) {
  console.log('sss', platform);
  switch (platform) {
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
  const keys = Object.keys(variables) as Array<keyof typeof variables>;
  const values = keys.map(k => variables[k]);
  return new Function(...keys, `{ return \`${template.replaceAll('\\', '\\\\')}\` }`).bind(variables)(...values);
}
