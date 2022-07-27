import type { Plugin, TAbstractFile } from 'obsidian';

declare global {
  interface Window {
    hmr(plugin: Plugin): void;
  }
}

Window.prototype.hmr = function(plugin: Plugin): void {
  console.log(`[hmr: ${plugin.manifest.name}]`);

  const { app: { vault: { adapter }, plugins }, manifest: { dir: pluginDir, id }  } = plugin;
  const { app: { vault } }= plugin;

  const onChange = async (file: string) => {
    if (file.startsWith(pluginDir)) {
      await plugins.disablePlugin(id);
      await plugins.enablePlugin(id);
    }
  };

  plugin.registerEvent(vault.on('raw', debounce(onChange, 700)));

  adapter.startWatchPath(pluginDir);
  plugin.register(() => adapter.stopWatchPath(pluginDir));
};

// eslint-disable-next-line @typescript-eslint/ban-types
function debounce<T extends Function>(cb: T, wait = 20) {
  let h = 0;
  const callable = (...args: unknown[]) => {
    window.clearTimeout(h);
    h = window.setTimeout(() => cb(...args), wait);
  };
  return <T>(<unknown>callable);
}

export {};


