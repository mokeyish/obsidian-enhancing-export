import './polyfill';
import { App, Menu, Plugin, PluginManifest, TFile } from 'obsidian';
import * as https from 'https';
import * as fs from 'fs';
import * as fsp from 'fs/promises';

import { UniversalExportPluginSettings, DEFAULT_SETTINGS} from './settings';
import { ExportDialog } from './ui/export_modal';
import { ExportSettingTab } from './ui/setting_tab';
import lang, { Lang} from './lang';



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

    this.registerEvent(this.app.workspace.on('file-menu', (menu: Menu, file) => {
      if (file instanceof TFile) {
        menu.addItem((item) => {
          item
            .setTitle(this.lang.exportToOo)
            .setIcon('document')
            .onClick((): void => {
              new ExportDialog(this.app, this, file).open();
            });
        }).addSeparator();
      }
    }));
    this.downloadLuaScripts().then();
  }

  public async resetSettings(): Promise<void> {
    this.settings = {
      ...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      lastExportDirectory: this.settings.lastExportDirectory,
    };
    await this.saveSettings();
  }

  public async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), await this.loadData());
  }

  public async saveSettings(): Promise<void> {
    console.log('saveSettings', this.settings);
    await this.saveData(this.settings);
  }
  
  async downloadLuaScripts(): Promise<void> {
    const luaDir = `${this.app.vault.adapter.getBasePath()}/${this.manifest.dir}/lua`;
    await fsp.mkdir(luaDir, {recursive: true});
    
    const luaScripts = [
      'utf8_filenames.lua', 
      'url.lua', 
      'polyfill.lua', 
      'markdown.lua',
      'markdown+hugo.lua'
    ];
    for (const luaScript of luaScripts) {
      const luaFile = `${luaDir}/${luaScript}`;
      if (fs.existsSync(luaScript)) {
        continue;
      }
      await this.download(
        `https://cdn.jsdelivr.net/gh/mokeyish/obsidian-enhancing-export@master/lua/${luaScript}`,
        luaFile
      );
      console.log(`下载成功=${luaScript}`);
    }
  }

  download(url: string, dest: string): Promise<void> {
    return new Promise<void>((resolve) => {
      https.get(url, (res) => {
        const writeStream = fs.createWriteStream(dest);
        res.pipe(writeStream);
        writeStream.on('finish', () => {
          writeStream.close();
          resolve();
        });
      });
    });
  }
}








