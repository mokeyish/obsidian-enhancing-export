import { App, Modal, Setting } from 'obsidian';
import type { ExportSettingTab } from './setting_tab';
import type { ExportSetting } from '../settings';

export class RenemeModal extends Modal {
  private readonly settingTab: ExportSettingTab;
  private readonly setting: ExportSetting;
  private readonly callback: (name: string) => void;
  get lang() {
    return this.settingTab.lang;
  }
  constructor(app: App, settingTab: ExportSettingTab, setting: ExportSetting, callback: (name: string) => void) {
    super(app);
    this.settingTab = settingTab;
    this.setting = setting;
    this.callback = callback;
  }

  onOpen() {
    const { contentEl, titleEl, lang, setting } = this;
    titleEl.setText(lang.rename);

    let name = setting.name;

    new Setting(contentEl).setName(lang.name).addText(cb => {
      cb.setValue(setting.name).onChange(v => (name = v));
    });

    contentEl.createEl('div', { cls: ['modal-button-container'], parent: contentEl }, el => {
      el.createEl('button', { text: lang.save, cls: ['mod-cta'], parent: el }).onclick = async () => {
        // success
        this.callback(name);
        this.close();
      };
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
