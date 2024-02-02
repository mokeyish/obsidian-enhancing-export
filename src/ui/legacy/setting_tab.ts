import { App, PluginSettingTab, Setting, TextComponent } from 'obsidian';
import * as ct from 'electron';
import { CustomExportSetting, ExportSetting, PandocExportSetting, UniversalExportPluginSettings } from '../../settings';
import { setPlatformValue, getPlatformValue } from '../../utils';
import pandoc from '../../pandoc';

import { Modal } from 'obsidian';
import export_command_templates from '../../export_templates';
import type ExportSettingTab from './setting_tab';
import type UniversalExportPlugin from '../../main';

export default class extends PluginSettingTab {
  plugin: UniversalExportPlugin;

  public get lang() {
    return this.plugin.lang;
  }

  constructor(plugin: UniversalExportPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
    this.name = this.plugin.lang.settingTab.title;
  }

  hide() {
    const { containerEl } = this;
    containerEl.empty();
  }
  display(): void {
    const { containerEl, lang, plugin } = this;
    containerEl.empty();
    const validateCallback = (v: unknown, k: keyof typeof t, t: unknown): boolean => {
      const sv = t[k];
      if (v === sv) {
        return false;
      }
      // noinspection RedundantIfStatementJS
      if (k !== 'lastEditName' && sv === undefined && (v === false || v === '')) {
        return false;
      }
      return true;
    };
    const changedCallback = async (v: unknown, k: keyof typeof t, t: unknown) => {
      if (v !== undefined) {
        if (v === false || (typeof v === 'string' && v.trim() === '')) {
          delete t[k];
        }
      }
      await plugin.saveSettings();
    };

    const globalSettingWatcher = new Watcher<UniversalExportPluginSettings>({
      onChangingCallback: validateCallback,
      onChangedCallback: changedCallback,
    });

    const settingWatcher = new Watcher<ExportSetting>({
      onChangingCallback: validateCallback,
      onChangedCallback: changedCallback,
    });
    const pandocSettingWatcher = settingWatcher.as<PandocExportSetting>();
    const customSettingWatcher = settingWatcher.as<CustomExportSetting>();

    let globalSetting = new Proxy(plugin.settings, globalSettingWatcher);
    let current = new Proxy(
      globalSetting.items.find(v => v.name === globalSetting.lastEditName) ?? globalSetting.items.first(),
      settingWatcher
    );

    const changeEditExportSetting = (name: string) => {
      const newSetting = globalSetting.items.find(v => v.name === name) ?? globalSetting.items.first();
      if (globalSetting.lastEditName !== newSetting.name) {
        globalSetting.lastEditName = newSetting.name;
      }
      if (newSetting) {
        current = new Proxy(newSetting, settingWatcher);
        settingWatcher.fireChanged(current);
      }
    };

    containerEl.createEl('h2', { text: lang.settingTab.title });

    // General
    new Setting(containerEl)
      .setName(lang.settingTab.general)
      .addExtraButton(cb => {
        cb.setIcon('reset')
          .setTooltip(lang.settingTab.reset)
          .onClick(async () => {
            await this.plugin.resetSettings();

            globalSetting = new Proxy(plugin.settings, globalSettingWatcher);
            globalSettingWatcher.fireChanged(globalSetting);

            changeEditExportSetting(globalSetting.lastEditName);
          });
      })
      .setHeading();

    const pandocPathSetting = new Setting(containerEl);
    pandoc
      .getVersion(getPlatformValue(globalSetting.pandocPath))
      .then(ver => {
        pandocPathSetting.setDesc(lang.settingTab.pandocVersion(ver.version));
      })
      .catch(() => {
        pandocPathSetting.setDesc(lang.settingTab.pandocNotFound);
      });

    pandocPathSetting.setName(lang.settingTab.pandocPath).addText(cb => {
      cb.setPlaceholder(lang.settingTab.pandocPathPlaceholder).onChange(v => {
        if (globalSetting.pandocPath !== v) {
          globalSetting.pandocPath = setPlatformValue(globalSetting.pandocPath, v);
          pandoc
            .getVersion(getPlatformValue(globalSetting.pandocPath))
            .then(ver => {
              pandocPathSetting.setDesc(lang.settingTab.pandocVersion(ver.version));
            })
            .catch(() => {
              pandocPathSetting.setDesc(lang.settingTab.pandocNotFound);
            });
        }
      });

      globalSettingWatcher.watchOnChanged('pandocPath', value => {
        cb.setValue(getPlatformValue(value) ?? '');
      });
    });

    new Setting(containerEl).setName(lang.settingTab.defaultFolderForExportedFile).addDropdown(cb => {
      cb.addOptions({
        'Auto': lang.settingTab.auto,
        'Same': lang.settingTab.sameFolderWithCurrentFile,
        'Custom': lang.settingTab.customLocation,
      }).onChange((v: 'Auto' | 'Same' | 'Custom') => {
        if (globalSetting.defaultExportDirectoryMode !== v) {
          globalSetting.defaultExportDirectoryMode = v;
        }
      });
      globalSettingWatcher.watchOnChanged('defaultExportDirectoryMode', (value: 'Auto' | 'Same' | 'Custom') => {
        cb.setValue(value);
      });
    });

    const customDefaultExportDirectorySetting = new Setting(containerEl)
      .addText(cb => {
        globalSettingWatcher.watchOnChanged('customDefaultExportDirectory', (value?) => {
          const val = getPlatformValue(value);
          cb.setValue(val ?? '');
          setTooltip(cb.inputEl, val);
        });
      })
      .setClass('ex-setting-item')
      .addExtraButton(cb => {
        cb.setIcon('folder').onClick(async () => {
          const retval = await ct.remote.dialog.showOpenDialog({
            defaultPath: getPlatformValue(globalSetting.customDefaultExportDirectory) ?? ct.remote.app.getPath('documents'),
            properties: ['createDirectory', 'openDirectory'],
          });

          if (!retval.canceled && retval.filePaths.length > 0) {
            globalSetting.customDefaultExportDirectory = setPlatformValue(globalSetting.customDefaultExportDirectory, retval.filePaths[0]);
          }
        });
        globalSettingWatcher.watchOnChanged('customDefaultExportDirectory', value => {
          const text = customDefaultExportDirectorySetting.components.first() as TextComponent;
          const val = getPlatformValue(value);
          text.setValue(val ?? '');
          setTooltip(text.inputEl, val);
        });
      });
    globalSettingWatcher.watchOnChanged('defaultExportDirectoryMode', value => {
      setVisible(customDefaultExportDirectorySetting.settingEl, value === 'Custom');
    });

    new Setting(containerEl).setName(lang.settingTab.openExportedFileLocation).addToggle(cb => {
      cb.onChange(v => {
        if (globalSetting.openExportedFileLocation !== v) {
          globalSetting.openExportedFileLocation = v;
        }
      });
      globalSettingWatcher.watchOnChanged('openExportedFileLocation', v => {
        cb.setValue(v);
      });
    });

    new Setting(containerEl).setName(lang.settingTab.openExportedFile).addToggle(cb => {
      cb.onChange(v => {
        if (globalSetting.openExportedFile !== v) {
          globalSetting.openExportedFile = v;
        }
      });
      globalSettingWatcher.watchOnChanged('openExportedFile', v => {
        cb.setValue(v);
      });
    });

    // settings for export type

    new Setting(containerEl).setName(lang.settingTab.editCommandTemplate).setHeading();

    new Setting(containerEl)
      .setName(lang.settingTab.chooseCommandTemplate)
      .addDropdown(cb => {
        cb.onChange(v => {
          if (globalSetting.lastEditName !== v) {
            changeEditExportSetting(v);
          }
        });
        globalSettingWatcher.watchOnChanged('items', (value: ExportSetting[]) => {
          cb.selectEl.empty();
          cb.addOptions(Object.fromEntries(value.map(o => [o.name, o.name])));
          cb.setValue(globalSetting.lastEditName ?? globalSetting.items.first()?.name);
        });
        globalSettingWatcher.watchOnChanged('lastEditName', value => {
          cb.setValue(value);
        });
      })
      .addExtraButton(button => {
        button.setTooltip(lang.settingTab.add);
        button.setIcon('plus');
        button.onClick(() => {
          new AddNewModal(this.app, this, s => {
            globalSetting.items = [...globalSetting.items, s];
            changeEditExportSetting(s.name);
          }).open();
        });
      })
      .addExtraButton(button => {
        button.setTooltip(lang.settingTab.rename);
        button.setIcon('pencil');
        button.onClick(() => {
          new RenemeModal(this.app, this, current, n => {
            current.name = n;
            globalSetting.items = [...globalSetting.items];
            changeEditExportSetting(n);
          }).open();
        });
      })
      .addExtraButton(button => {
        button.setTooltip(lang.settingTab.remove);
        button.setIcon('trash');
        button.onClick(() => {
          globalSetting.items = globalSetting.items.filter(o => o.name != current.name);
          changeEditExportSetting(globalSetting.items.first()?.name);
        });
      });

    const commandSetting = new Setting(containerEl).setName(lang.settingTab.command).addText(cb => {
      cb.setDisabled(true);
      cb.onChange(v => {
        if (current.type === 'custom' && current.command !== v) {
          current.command = v;
        }
      });
      customSettingWatcher.watchOnChanged('command', value => {
        cb.setValue(value);
      });
      settingWatcher.watchOnChanged('type', value => {
        cb.setDisabled(value !== 'custom');
      });
    });
    settingWatcher.watchOnChanged('type', value => {
      setVisible(commandSetting.settingEl, value === 'custom');
    });

    const argumentsSetting = new Setting(containerEl).setName(lang.settingTab.arguments).addText(cb => {
      cb.setDisabled(true);
      cb.onChange(v => {
        if (current.type === 'pandoc' && current.arguments !== v) {
          current.arguments = v;
          setTooltip(cb.inputEl, current.arguments);
        }
      });
      pandocSettingWatcher.watchOnChanged('arguments', value => {
        cb.setValue(value ?? '');
        setTooltip(cb.inputEl, value);
      });
      settingWatcher.watchOnChanged('type', value => {
        cb.setDisabled(value !== 'custom');
      });
    });
    settingWatcher.watchOnChanged('type', value => {
      setVisible(argumentsSetting.settingEl, value === 'pandoc');
    });

    const targetFileExtensionsSetting = new Setting(containerEl).setName(lang.settingTab.targetFileExtensions).addText(cb => {
      cb.onChange(v => {
        if (current.type === 'custom' && current.targetFileExtensions !== v) {
          current.targetFileExtensions = v;
        }
      });

      customSettingWatcher.watchOnChanged('targetFileExtensions', value => {
        cb.setValue(value ?? '');
      });
    });
    settingWatcher.watchOnChanged('type', value => {
      setVisible(targetFileExtensionsSetting.settingEl, value === 'custom');
    });

    const customArgumentsSetting = new Setting(containerEl).setName(lang.settingTab.extraArguments).addText(cb => {
      cb.onChange(v => {
        if (current.type === 'pandoc' && current.customArguments !== v) {
          current.customArguments = v;
        }
      });
      pandocSettingWatcher.watchOnChanged('customArguments', value => {
        cb.setValue(value ?? '');
        setTooltip(cb.inputEl, value);
      });
    });
    settingWatcher.watchOnChanged('type', value => {
      setVisible(customArgumentsSetting.settingEl, value === 'pandoc');
    });

    new Setting(containerEl).setName(lang.settingTab.afterExport).setHeading();

    const showCommandOutputSetting = new Setting(containerEl).setName(lang.settingTab.showCommandOutput).addToggle(cb => {
      if (current.type === 'custom') {
        cb.setValue(current.showCommandOutput);
      }
      cb.onChange(v => {
        if (current.type === 'custom' && current.showCommandOutput !== v) {
          current.showCommandOutput = v;
        }
      });
    });
    settingWatcher.watchOnChanged('type', value => {
      setVisible(showCommandOutputSetting.settingEl, value === 'custom');
    });

    new Setting(containerEl).setName(lang.settingTab.openExportedFileLocation).addToggle(cb => {
      cb.onChange(v => {
        if (current.openExportedFileLocation !== v) {
          current.openExportedFileLocation = v;
        }
      });

      settingWatcher.watchOnChanged('openExportedFileLocation', value => {
        cb.setValue(value);
      });
    });

    new Setting(containerEl).setName(lang.settingTab.runCommand).addToggle(cb => {
      cb.onChange(v => {
        if (current.type === 'pandoc' && current.runCommand !== v) {
          current.runCommand = v;
        }
      });
      pandocSettingWatcher.watchOnChanged('runCommand', value => {
        cb.setValue(value);
      });
    });

    const commandAfterExportSetting = new Setting(containerEl).addText(cb => {
      cb.onChange(v => {
        if (current.command !== v) {
          current.command = v;
        }
      });

      pandocSettingWatcher.watchOnChanged('command', value => {
        cb.setValue(value);
      });

      pandocSettingWatcher.watchOnChanged('runCommand', (value, _, target) => {
        setVisible(commandAfterExportSetting.settingEl, target.type === 'pandoc' && value);
        cb.setValue(current.command);
      });
    });
    globalSettingWatcher.fireChanged(globalSetting);
    settingWatcher.fireChanged(current);
  }
}

class AddNewModal extends Modal {
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
    titleEl.setText(lang.settingTab.new);
    let tpl = Object.values(export_command_templates).first();
    let tplName = tpl.name;
    let name = tpl.name;

    // eslint-disable-next-line prefer-const
    let nameSetting: Setting;

    new Setting(contentEl).setName(lang.settingTab.template).addDropdown(cb => {
      cb.addOptions(Object.fromEntries(Object.values(export_command_templates).map(o => [o.name, o.name])))
        .setValue(tplName)
        .onChange(v => {
          tplName = v;
          name = v;

          (nameSetting.components.first() as TextComponent)?.setValue(name);
        });
    });

    nameSetting = new Setting(contentEl).setName(lang.settingTab.name).addText(cb => {
      cb.setValue(name).onChange(v => (name = v));
    });

    contentEl.createEl('div', { cls: ['modal-button-container'], parent: contentEl }, el => {
      el.createEl('button', {
        text: lang.settingTab.add,
        cls: ['mod-cta'],
        parent: el,
      }).onclick = async () => {
        tpl = JSON.parse(JSON.stringify(export_command_templates[tplName]));
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

class RenemeModal extends Modal {
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
    titleEl.setText(lang.settingTab.rename);

    let name = setting.name;

    new Setting(contentEl).setName(lang.settingTab.name).addText(cb => {
      cb.setValue(setting.name).onChange(v => (name = v));
    });

    contentEl.createEl('div', { cls: ['modal-button-container'], parent: contentEl }, el => {
      el.createEl('button', {
        text: lang.settingTab.save,
        cls: ['mod-cta'],
        parent: el,
      }).onclick = async () => {
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

type TOnChangingHandler<T extends object, K extends keyof T> = (value: T[K], key: K, target: T) => boolean;
type TOnChangedHandler<T extends object, K extends keyof T> = (value: T[K], key: K, target: T) => void;

export class Watcher<T extends object> {
  onChanging: { [k in keyof T]?: TOnChangingHandler<T, keyof T>[] };
  onChanged: { [k in keyof T]?: TOnChangedHandler<T, keyof T>[] };
  private readonly _onChangingCallback: TOnChangingHandler<T, keyof T>;
  private readonly _onChangedCallback: TOnChangedHandler<T, keyof T>;
  constructor(options?: { onChangingCallback?: TOnChangingHandler<T, keyof T>; onChangedCallback?: TOnChangedHandler<T, keyof T> }) {
    this.onChanging = {};
    this.onChanged = {};
    this._onChangingCallback = options?.onChangingCallback ?? (() => true);
    this._onChangedCallback = options?.onChangedCallback ?? (() => void 0);
  }
  as<T extends object>(): Watcher<T> {
    return this as unknown as Watcher<T>;
  }
  watchOnChanging<K extends keyof T>(key: K, handler: TOnChangingHandler<T, K>): void {
    (this.onChanging[key] ?? (this.onChanging[key] = [])).push(handler);
  }
  watchOnChanged<K extends keyof T>(key: K, handler: TOnChangedHandler<T, K>): void {
    (this.onChanged[key] ?? (this.onChanged[key] = [])).push(handler);
  }

  set<K extends keyof T>(target: T, key: K, value: T[K]): boolean {
    if (this._onChangingCallback && this._onChangingCallback(value, key, target) === false) {
      return false;
    }
    const onChangingHandlers = this.onChanging[key];
    if (onChangingHandlers) {
      let invalid = false;
      for (const h of onChangingHandlers) {
        if (!h(value, key, target)) {
          invalid = true;
        }
      }
      if (invalid) {
        return false;
      }
    }

    // The default behavior to store the value
    target[key] = value;

    const onChangedHandlers = this.onChanged[key];
    if (onChangedHandlers) {
      for (const h of onChangedHandlers) {
        try {
          h(value, key, target);
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (this._onChangedCallback) {
      this._onChangedCallback(value, key, target);
    }

    // Indicate success
    return true;
  }

  fireChanged(target: T) {
    for (const key of Object.keys(this.onChanged)) {
      const k = key as keyof T;
      const onChangedHandlers = this.onChanged[k];
      if (onChangedHandlers) {
        for (const h of onChangedHandlers) {
          try {
            h(target[k], k, target);
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }
}

export function setVisible(el: Element, visible: boolean) {
  if (visible) {
    el.removeAttribute('hidden');
  } else {
    el.setAttribute('hidden', '');
  }
  return el;
}

export function setTooltip(el: Element, tooltip?: string) {
  if (tooltip && tooltip.trim() != '') {
    el.setAttribute('title', tooltip);
  } else {
    el.removeAttribute('title');
  }
  return el;
}
