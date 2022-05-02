import { App, Modal, Setting, TextComponent } from 'obsidian';
import type { ExportSettingTab } from './setting_tab';
import {templates, ExportSetting} from '../settings';

export class AddNewModal extends Modal {
  readonly settingTab: ExportSettingTab;
  readonly callback: (setting: ExportSetting) => void;
  get lang() {
    return this.settingTab.lang;
  }
  constructor(app: App, settingTab: ExportSettingTab, callback: (setting: ExportSetting) => void) {
    super(app);
    this.settingTab = settingTab;
    this.callback = callback;
  }

  onOpen() {
    const { contentEl, titleEl, lang, callback } = this;
    titleEl.setText(lang.new);
    let tpl = Object.values(templates).first();
    let tplName = tpl.name;
    let name = tpl.name;

    // eslint-disable-next-line prefer-const
    let nameSetting: Setting;

    new Setting(contentEl).setName(lang.template).addDropdown(cb => {
      cb.addOptions(Object.fromEntries(Object.values(templates).map(o => [o.name, o.name])))
        .setValue(tplName)
        .onChange(v => {
          tplName = v;
          name = v;

          (nameSetting.components.first() as TextComponent)?.setValue(name);
        });
    });

    nameSetting = new Setting(contentEl)
      .setName(lang.name)
      .addText(cb => {
        cb.setValue(name)
          .onChange(v => name = v);
      });

    contentEl.createEl('div', { cls: ['modal-button-container'], parent: contentEl }, el => {
      el.createEl('button', { text: lang.add, cls: ['mod-cta'], parent: el }).onclick = async () => {
        tpl = JSON.parse(JSON.stringify(templates[tplName]));
        tpl.name = name;
        callback(tpl);
        this.close();
      };
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}