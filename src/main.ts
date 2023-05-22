import ct from 'electron';
import { App, Menu, Plugin, PluginManifest, TFile, Notice } from 'obsidian';
import { UniversalExportPluginSettings, ExportSetting, DEFAULT_SETTINGS, getPlatformValue } from './settings';
// import ExportDialog from './ui/export_dialog';
import ExportDialog from './ui/ExportDialog'; // solidjs
// import ExportSettingTab from './ui/setting_tab';
import ExportSettingTab from './ui/SettingTab'; // solidjs
import { exportToOo } from './exporto0o';
import { env } from './utils';
import lang, { Lang } from './lang';
import './styles.css';

const luaScripts = Object.fromEntries(
  Object.entries(import.meta.glob<{ default: Uint8Array }>('lua/*.lua', { eager: true })).map(([k, m]) => [
    k.substring('/lua'.length),
    m.default,
  ])
);

export default class UniversalExportPlugin extends Plugin {
  settings: UniversalExportPluginSettings;
  lang: Lang;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.lang = lang.current;
  }

  async onload() {
    switch (ct.remote.process.platform) {
      case 'darwin': {
        let envPath = ct.remote.process.env['PATH'];
        const extraBins = ['/usr/local/bin', '/Library/TeX/texbin'];
        for (const bin of extraBins) {
          if (envPath.includes(bin)) continue;
          envPath = `${bin}:${envPath}`;
        }
        env.PATH = envPath;
        break;
      }
      default:
        break;
    }
    if (ct.remote.process.env['HOME']) {
      env.HOME = ct.remote.process.env['HOME'];
    }

    await this.releaseLuaScripts();

    await this.loadSettings();
    const { lang } = this;

    this.addSettingTab(new ExportSettingTab(this));

    this.addCommand({
      id: 'obsidian-enhancing-export:export',
      name: lang.exportToOo,
      icon: 'document',
      callback: () => {
        const file = this.app.workspace.getActiveFile();
        if (file) {
          ExportDialog.show(this, file);
        } else {
          new Notice(lang.pleaseOpenFile, 2000);
        }
      },
    });
    this.addCommand({
      id: 'obsidian-enhancing-export:export-with-previous',
      name: lang.exportWithPrevious,
      icon: 'document',
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (file) {
          if (this.settings.lastExportType && this.settings.lastExportDirectory) {
            const setting = this.settings.items.find(s => s.name === this.settings.lastExportType);
            if (setting) {
              await exportToOo(this, file, getPlatformValue(this.settings.lastExportDirectory), undefined, setting);
              return;
            }
          }
          ExportDialog.show(this, file);
        } else {
          new Notice(lang.pleaseOpenFile, 2000);
        }
      },
    });

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu: Menu, file) => {
        if (file instanceof TFile) {
          menu
            .addItem(item => {
              item
                .setTitle(lang.exportToOo)
                .setIcon('document')
                .onClick((): void => {
                  ExportDialog.show(this, file);
                });
            })
            .addSeparator();
        }
      })
    );
    // this.downloadLuaScripts().then();

    window.hmr && window.hmr(this);
  }

  public async resetSettings(): Promise<void> {
    this.settings = {
      ...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      lastExportDirectory: this.settings.lastExportDirectory,
    };
    await this.saveSettings();
  }

  public async loadSettings(): Promise<void> {
    const settings: UniversalExportPluginSettings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    settings.items.forEach(v => {
      Object.assign(v, DEFAULT_SETTINGS.items.find(o => o.name === v.name) ?? {}, v);
    });
    for (const item of DEFAULT_SETTINGS.items) {
      if (settings.items.every(o => o.name !== item.name)) {
        settings.items.push(item);
      }
    }
    this.settings = settings;
  }

  public async saveSettings(): Promise<void> {
    console.log('[obsidian-enhancing-export] saveSettings', this.settings);
    const settings: UniversalExportPluginSettings = JSON.parse(JSON.stringify(this.settings));
    settings.items.forEach(v => {
      const def = DEFAULT_SETTINGS.items.find(o => o.name === v.name);
      if (def) {
        Object.keys(v).forEach((k: keyof ExportSetting) => {
          if (k !== 'name' && v[k] === def[k]) {
            delete v[k];
          }
        });
      }
    });
    await this.saveData(settings);
  }

  async releaseLuaScripts(): Promise<void> {
    const { adapter } = this.app.vault;
    const luaDir = `${this.manifest.dir}/lua`;
    await adapter.mkdir(luaDir);
    for (const scriptName of Object.keys(luaScripts) as Array<keyof typeof luaScripts>) {
      const luaFile = `${luaDir}/${scriptName}`;
      await adapter.writeBinary(luaFile, luaScripts[scriptName]);
      delete luaScripts[scriptName];
    }
  }
}
