import luaScripts from './lua';
import { App, Menu, Plugin, PluginManifest, TFile, Notice } from 'obsidian';
import { UniversalExportPluginSettings, ExportSetting, DEFAULT_SETTINGS, getPlatformValue } from './settings';
import { ExportDialog } from './ui/export_dialog';
import { ExportSettingTab } from './ui/setting_tab';
import lang, { Lang } from './lang';
import { exportToOo } from './exporto0o';

export default class UniversalExportPlugin extends Plugin {
  settings: UniversalExportPluginSettings;
  lang: Lang;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.lang = lang.current;
  }

  async onload() {
    await this.loadSettings();
    const { lang } = this;

    this.addSettingTab(new ExportSettingTab(this.app, this));

    this.addCommand({
      id: 'obsidian-enhancing-export:export',
      name: lang.exportToOo,
      icon: 'document',
      callback: () => {
        const file = this.app.workspace.getActiveFile();
        if (file) {
          new ExportDialog(this.app, this, file).open();
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
          new ExportDialog(this.app, this, file).open();
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
                  new ExportDialog(this.app, this, file).open();
                });
            })
            .addSeparator();
        }
      })
    );
    // this.downloadLuaScripts().then();
  }

  public async resetSettings(): Promise<void> {
    this.settings = {
      ...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      lastExportDirectory: this.settings.lastExportDirectory,
    };
    await this.saveSettings();
  }

  public async loadSettings(): Promise<void> {
    const settings: UniversalExportPluginSettings = Object.assign({}, await this.loadData());
    settings.items.forEach(v => {
      Object.assign(v, DEFAULT_SETTINGS.items.find(o => o.name === v.name) ?? {}, v);
    });
    this.settings = settings;
    if (this.settings.version !== this.manifest.version) {
      await this.saveLuaScripts();
      this.settings.version = this.manifest.version;
      await this.saveSettings();
    }
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

  async saveLuaScripts(): Promise<void> {
    const { adapter } = this.app.vault;
    const luaDir = `${this.manifest.dir}/lua`;
    await adapter.mkdir(luaDir);
    for (const luaScript of Object.keys(luaScripts) as Array<keyof typeof luaScripts>) {
      const luaFile = `${luaDir}/${luaScript}`;
      await adapter.writeBinary(luaFile, luaScripts[luaScript]);
    }
  }
}
