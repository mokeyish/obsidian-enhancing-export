import { App, Menu, Plugin, PluginManifest, TFile, Notice, debounce } from 'obsidian';
import { UniversalExportPluginSettings, ExportSetting, DEFAULT_SETTINGS, DEFAULT_ENV } from './settings';
// import { ExportSettingTab, ExportDialog } from './ui/legacy';
import { ExportSettingTab, ExportDialog } from './ui';
import { exportToOo } from './exporto0o';
import { getPlatformValue, PlatformKey } from './utils';
import lang, { Lang } from './lang';
import path from 'path';
import resources from './resources';
import './styles.css';

export default class UniversalExportPlugin extends Plugin {
  settings: UniversalExportPluginSettings;
  lang: Lang;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.lang = lang.current;
    this.saveSettings = debounce(this.saveSettings.bind(this), 1000, true) as unknown as typeof this.saveSettings;
  }

  async onload() {
    await this.releaseResources();

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
    if (import.meta.env.DEV) {
      window.hmr && window.hmr(this);
    }
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
      Object.assign(v, Object.assign({}, DEFAULT_SETTINGS.items.find(o => o.name === v.name) ?? {}, v));
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
          if (k !== 'name' && JSON.stringify(v[k]) === JSON.stringify(def[k])) {
            delete v[k];
          }
        });
      }
    });
    if (settings.env) {
      for (const platform of Object.keys(settings.env) as PlatformKey[]) {
        const env = settings.env[platform];
        if (JSON.stringify(env) === JSON.stringify(DEFAULT_ENV[platform])) {
          delete settings.env[platform];
          continue;
        }
        const refEnv = getPlatformValue(DEFAULT_ENV, platform);
        for (const [name, value] of Object.entries(env)) {
          if (value === refEnv[name]) {
            delete env[name];
          }
        }
        if (Object.keys(env).length === 0) {
          delete settings.env[platform];
        }
      }
    }
    await this.saveData(settings);
  }

  async releaseResources(): Promise<void> {
    const { adapter } = this.app.vault;
    for (const [dir, res] of resources) {
      const resDir = path.join(this.manifest.dir, dir);
      await adapter.mkdir(resDir);
      for (const [fileName, bytes] of res) {
        const filePath = path.join(resDir, fileName);
        await adapter.writeBinary(filePath, bytes);
      }
    }
    resources.length = 0;
  }
}
