import luaScripts from './lua';
import { App, Menu, Plugin, PluginManifest, TFile } from 'obsidian';
import { UniversalExportPluginSettings, DEFAULT_SETTINGS } from './settings';
import { ExportDialog } from './ui/export_modal';
import { ExportSettingTab } from './ui/setting_tab';
import lang, { Lang } from './lang';

export default class UniversalExportPlugin extends Plugin {
  settings: UniversalExportPluginSettings;
  lang: Lang;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
  }

  async onload() {
    await this.loadSettings();
    this.lang = lang.current;

    this.addSettingTab(new ExportSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu: Menu, file) => {
        if (file instanceof TFile) {
          menu
            .addItem(item => {
              item
                .setTitle(this.lang.exportToOo)
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
    this.settings = Object.assign(
      {},
      JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      await this.loadData()
    );
    if (this.settings.version !== this.manifest.version) {
      await this.saveLuaScripts();
      this.settings.version = this.manifest.version;
      await this.saveSettings();
    }
  }

  public async saveSettings(): Promise<void> {
    console.log('[obsidian-enhancing-export] saveSettings', this.settings);
    await this.saveData(this.settings);
  }

  async saveLuaScripts(): Promise<void> {
    const { adapter } = this.app.vault;
    const luaDir = `${this.manifest.dir}/lua`;
    await adapter.mkdir(luaDir);
    for (const luaScript of Object.keys(luaScripts) as Array<
      keyof typeof luaScripts
    >) {
      const luaFile = `${luaDir}/${luaScript}`;
      await adapter.writeBinary(luaFile, luaScripts[luaScript]);
    }
  }
}
