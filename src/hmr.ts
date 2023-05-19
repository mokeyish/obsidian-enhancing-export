import type { Plugin } from 'obsidian';
import { debounce, Platform } from 'obsidian';
import { normalize, join } from 'path';

declare global {
  interface Window {
    hmr(plugin: Plugin, watchFiles?: Array<'main.js' | 'manifest.json' | 'styles.css'> | string[]): void;
  }
}

Window.prototype.hmr = function (plugin: Plugin, watchFiles: string[] = ['main.js', 'manifest.json', 'styles.css']): void {
  if (Platform.isMobile) {
    return;
  }

  console.log(`[hmr: ${plugin.manifest.name}]`);

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
  const entry = normalize(join(pluginDir, 'main.js'));
  const onChange = async (file: string) => {
    if (file.startsWith(pluginDir)) {
      if (!(await adapter.exists(entry))) {
        return;
      }
      await plugins.disablePlugin(id);
      await plugins.enablePlugin(id);
    }
  };

  plugin.registerEvent(vault.on('raw', debounce(onChange, 500)));

  adapter.startWatchPath(pluginDir);
  plugin.register(() => adapter.stopWatchPath(pluginDir));
  adapter.startWatchPath(pluginDir);
};

export {};
