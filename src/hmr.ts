import type { Plugin } from 'obsidian';
import { debounce, Platform } from 'obsidian';
import { normalize, join } from 'path';

declare global {
  interface HmrOptions {
    watchFiles?: Array<'main.js' | 'manifest.json' | 'styles.css'> | string[],
  }
  interface Window {
    hmr(plugin: Plugin, options?: HmrOptions): void;
  }
}

Window.prototype.hmr = function (plugin: Plugin, options?: HmrOptions): void {
  if (Platform.isMobile) {
    return;
  }

  console.log(`[hmr: ${plugin.manifest.name}]`, new Date());

  options ??= {};
  options.watchFiles ??= ['main.js', 'manifest.json', 'styles.css'];
  const { watchFiles } = options;

  const {
    app: {
      vault: { adapter },
      plugins,
    },
    manifest: { dir: pluginDir, id },
  } = plugin;
  const {
    app: { vault },
  } = plugin;

  const restartPlugin = async () => {
    const dbgKey = 'debug-plugin';
    const oldDebug = localStorage.getItem(dbgKey);
    try {
      localStorage.setItem(dbgKey, '1');
      await plugins.disablePlugin(id);
      await plugins.enablePlugin(id);
    } finally {
      if (oldDebug) {
        localStorage.setItem(dbgKey, oldDebug);
      } else {
        localStorage.removeItem(dbgKey);
      }
    }
  };

  const entry = normalize(join(pluginDir, 'main.js'));
  const onChange = debounce(
    async (file: string) => {
      if (file.startsWith(pluginDir)) {
        if (!(await adapter.exists(entry))) {
          return;
        }
        if (file === pluginDir) {
          // reload
        } else if (watchFiles?.length > 0) {
          if (!watchFiles.some(o => file.endsWith(o))) {
            return;
          }
        }
        await restartPlugin();
      }
    },
    500,
    true
  );

  plugin.registerEvent(vault.on('raw', onChange));

  plugin.register(() => adapter.stopWatchPath(pluginDir));
  adapter.startWatchPath(pluginDir);
};

export {};
