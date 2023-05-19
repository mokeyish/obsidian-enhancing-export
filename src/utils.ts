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

export function setVisible(el: Element, visible: boolean) {
  if (visible) {
    el.removeAttribute('hidden');
  } else {
    el.setAttribute('hidden', '');
  }
  return el;
}

export function setTooltip(el: Element, tooltip?: string) {
  if (tooltip && tooltip.trim() != '') {
    el.setAttribute('title', tooltip);
  } else {
    el.removeAttribute('title');
  }
  return el;
}

// noinspection SpellCheckingInspection
export const nameofFactory =
  <T>() =>
  (name: keyof T) =>
    name;

type TOnChangingHandler<T extends object, K extends keyof T> = (value: T[K], key: K, target: T) => boolean;
type TOnChangedHandler<T extends object, K extends keyof T> = (value: T[K], key: K, target: T) => void;

export class Watcher<T extends object> {
  onChanging: { [k in keyof T]?: TOnChangingHandler<T, keyof T>[] };
  onChanged: { [k in keyof T]?: TOnChangedHandler<T, keyof T>[] };
  private readonly _onChangingCallback: TOnChangingHandler<T, keyof T>;
  private readonly _onChangedCallback: TOnChangedHandler<T, keyof T>;
  constructor(options?: { onChangingCallback?: TOnChangingHandler<T, keyof T>; onChangedCallback?: TOnChangedHandler<T, keyof T> }) {
    this.onChanging = {};
    this.onChanged = {};
    this._onChangingCallback = options?.onChangingCallback ?? (() => true);
    this._onChangedCallback = options?.onChangedCallback ?? (() => void 0);
  }
  as<T extends object>(): Watcher<T> {
    return this as unknown as Watcher<T>;
  }
  watchOnChanging<K extends keyof T>(key: K, handler: TOnChangingHandler<T, K>): void {
    (this.onChanging[key] ?? (this.onChanging[key] = [])).push(handler);
  }
  watchOnChanged<K extends keyof T>(key: K, handler: TOnChangedHandler<T, K>): void {
    (this.onChanged[key] ?? (this.onChanged[key] = [])).push(handler);
  }

  set<K extends keyof T>(target: T, key: K, value: T[K]): boolean {
    if (this._onChangingCallback && this._onChangingCallback(value, key, target) === false) {
      return false;
    }
    const onChangingHandlers = this.onChanging[key];
    if (onChangingHandlers) {
      let invalid = false;
      for (const h of onChangingHandlers) {
        if (!h(value, key, target)) {
          invalid = true;
        }
      }
      if (invalid) {
        return false;
      }
    }

    // The default behavior to store the value
    target[key] = value;

    const onChangedHandlers = this.onChanged[key];
    if (onChangedHandlers) {
      for (const h of onChangedHandlers) {
        try {
          h(value, key, target);
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (this._onChangedCallback) {
      this._onChangedCallback(value, key, target);
    }

    // Indicate success
    return true;
  }

  fireChanged(target: T) {
    for (const key of Object.keys(this.onChanged)) {
      const k = key as keyof T;
      const onChangedHandlers = this.onChanged[k];
      if (onChangedHandlers) {
        for (const h of onChangedHandlers) {
          try {
            h(target[k], k, target);
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }
}

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
