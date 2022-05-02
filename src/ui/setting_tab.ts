import {App, PluginSettingTab, Setting, TextComponent} from 'obsidian';
import * as ct from 'electron';
import { Watcher } from '../utils';
import type UniversalExportPlugin from '../main';
import {
  CustomExportSetting,
  ExportSetting,
  PandocExportSetting,
  PlatformValue, setPlatformValue, getPlatformValue,
  UniversalExportPluginSettings
} from '../settings';
import { RenemeModal } from './rename_modal';
import { AddNewModal } from './add_new_modal';

export class ExportSettingTab extends PluginSettingTab {
  plugin: UniversalExportPlugin;
  
  public get lang() {
    return this.plugin.lang;
  }
  
  constructor(app: App, plugin: UniversalExportPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.name = this.plugin.lang.settingTabTitle;
  }
  
  hide() {
    const { containerEl } = this;
    containerEl.empty();
  }
  display(): void {
    const { containerEl, lang, plugin } = this;
    containerEl.empty();
    const validateCallback = (v: unknown, k: keyof typeof t, t: unknown ): boolean => {
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
    const changedCallback = async (v: unknown, k: keyof typeof t, t: unknown ) => {
      if (v !== undefined) {
        if (v === false || typeof v === 'string' && v.trim() === '') {
          delete t[k];
        }
      }
      await plugin.saveSettings();
    };
    
    const globalSettingWatcher = new Watcher<UniversalExportPluginSettings>({onChangingCallback: validateCallback, onChangedCallback: changedCallback});
    
    const settingWatcher = new Watcher<ExportSetting>({onChangingCallback: validateCallback, onChangedCallback: changedCallback});
    const pandocSettingWatcher = settingWatcher.as<PandocExportSetting>();
    const customSettingWatcher = settingWatcher.as<CustomExportSetting>();

    let globalSetting = new Proxy(plugin.settings, globalSettingWatcher);
    let current = new Proxy(globalSetting.items.find((v) => v.name === globalSetting.lastEditName) ?? globalSetting.items.first(), settingWatcher);
    
    const changeEditExportSetting = (name: string) => {
      const newSetting = globalSetting.items.find((v) => v.name === name) ?? globalSetting.items.first();
      if (globalSetting.lastEditName !== newSetting.name) {
        globalSetting.lastEditName = newSetting.name;
      }
      if (newSetting) {
        current = new Proxy(newSetting, settingWatcher);
        settingWatcher.fireChanged(current);
      }
    };
    
    
    containerEl.createEl('h2', { text: lang.settingTabTitle });
    {
      console.log('display');
    }

    // General
    new Setting(containerEl).setName(lang.general).addExtraButton(cb => {
      cb.setIcon('reset')
        .setTooltip(lang.reset)
        .onClick(async () => {
          await this.plugin.resetSettings();
          
          globalSetting = new Proxy(plugin.settings, globalSettingWatcher);
          globalSettingWatcher.fireChanged(globalSetting);
          
          changeEditExportSetting(globalSetting.lastEditName);
        });
    }).setHeading();

    new Setting(containerEl)
      .setName(lang.pandocPath)
      .addText(cb => {
        cb.setPlaceholder(lang.pandocPathPlaceholder)
          .onChange(v => {
            if (globalSetting.pandocPath !== v) {
              globalSetting.pandocPath = setPlatformValue(globalSetting.pandocPath, v);
            }
          });
        
        globalSettingWatcher.watchOnChanged('pandocPath', ((value) => {
          cb.setValue(getPlatformValue(value) ?? '');
        }));
      });

    new Setting(containerEl)
      .setName(lang.defaultFolderForExportedFile)
      .addDropdown(cb => {
        cb.addOptions({
          'Auto': lang.auto,
          'Same': lang.sameFolderWithCurrentFile,
          'Custom': lang.customLocation
        }).onChange((v: 'Auto' | 'Same' | 'Custom') => {
          if (globalSetting.defaultExportDirectoryMode !== v) {
            globalSetting.defaultExportDirectoryMode = v;
          }
        });
        globalSettingWatcher.watchOnChanged('defaultExportDirectoryMode',
          ((value: 'Auto' | 'Same' | 'Custom') => {
            cb.setValue(value);
          }));
      });

    const customDefaultExportDirectorySetting = new Setting(containerEl)
      .addText(cb => {
        globalSettingWatcher.watchOnChanged('customDefaultExportDirectory', (value?) => {
          const val = getPlatformValue(value);
          cb.setValue(val ?? '');
          cb.inputEl.setTooltip(val);
        });
      })
      .setClass('ex-setting-item')
      .addExtraButton(cb => {
        cb.setIcon('folder').onClick(async () => {
          const retval = await ct.remote.dialog.showOpenDialog({
            defaultPath: getPlatformValue(globalSetting.customDefaultExportDirectory) ?? ct.remote.app.getPath('documents'),
            properties: ['createDirectory', 'openDirectory']
          });
          
          if (!retval.canceled && retval.filePaths.length > 0) {
            globalSetting.customDefaultExportDirectory = setPlatformValue(globalSetting.customDefaultExportDirectory, retval.filePaths[0]);
          }
        });
        globalSettingWatcher.watchOnChanged('customDefaultExportDirectory',
          ((value) => {
            const text = customDefaultExportDirectorySetting.components.first() as TextComponent;
            const val = getPlatformValue(value);
            text.setValue(val ?? '');
            text.inputEl.setTooltip(val);
          }));
      });
    globalSettingWatcher.watchOnChanged('defaultExportDirectoryMode', (value) => {
      customDefaultExportDirectorySetting.settingEl.setVisible(value === 'Custom');
    });
    
    new Setting(containerEl).setName(lang.openExportedFileLocation).addToggle(cb => {
      cb.onChange(v => {
        if (globalSetting.openExportedFileLocation !== v) {
          globalSetting.openExportedFileLocation = v;
        }
      });
      globalSettingWatcher.watchOnChanged('openExportedFileLocation', (v) => {
        cb.setValue(v);
      });
    });

    new Setting(containerEl).setName(lang.openExportedFile).addToggle(cb => {
      cb.onChange(v => {
        if (globalSetting.openExportedFile !== v) {
          globalSetting.openExportedFile = v;
        }
      });
      globalSettingWatcher.watchOnChanged('openExportedFile', (v) => {
        cb.setValue(v);
      });
    });

    // settings for export type

    new Setting(containerEl).setName(lang.settingTabTitle).setHeading();


    new Setting(containerEl).setName(lang.chooseSetting).addDropdown(cb => {
      cb.onChange(v => {
        if (globalSetting.lastEditName !== v) {
          changeEditExportSetting(v);
        }
      });
      globalSettingWatcher.watchOnChanged('items', ((value: ExportSetting[]) => {
        cb.selectEl.empty();
        cb.addOptions(Object.fromEntries(value.map(o => [o.name, o.name])));
        cb.setValue(globalSetting.lastEditName ?? globalSetting.items.first()?.name);
      }));
      globalSettingWatcher.watchOnChanged('lastEditName', ((value) => {
        cb.setValue(value);
      }));
    }).addExtraButton(button => {
      button.setTooltip(lang.add);
      button.setIcon('plus');
      button.onClick(() => {
        new AddNewModal(this.app, this, (s) => {
          globalSetting.items = [...globalSetting.items, s];
          changeEditExportSetting(s.name);
        }).open();
      });
    })
      .addExtraButton(button => {
        button.setTooltip(lang.rename);
        button.setIcon('pencil');
        button.onClick(() => {
          new RenemeModal(this.app, this, current, (n) => {
            current.name = n;
            globalSetting.items = [...globalSetting.items];
            changeEditExportSetting(n);
          }).open();
        });
      })
      .addExtraButton(button => {
        button.setTooltip(lang.remove);
        button.setIcon('trash');
        button.onClick(() => {
          globalSetting.items = globalSetting.items.filter(o => o.name != current.name);
          changeEditExportSetting(globalSetting.items.first()?.name);
        });
      });

    
    const commandSetting = new Setting(containerEl)
      .setName(lang.command)
      .addText(cb => {
        cb.setDisabled(true);
        cb.onChange(v => {
          if (current.type === 'custom' && current.command !== v) {
            current.command = v;
          }
        });
        customSettingWatcher.watchOnChanged('command', (value) => {
          cb.setValue(value);
        });
      });
    settingWatcher.watchOnChanged('type', (value) => {
      commandSetting.settingEl.setVisible(value === 'custom');
    });


    const argumentsSetting = new Setting(containerEl)
      .setName(lang.arguments)
      .addText(cb => {
        cb.setDisabled(true);
        cb.onChange(v => {
          if (current.type === 'pandoc' && current.arguments !== v) {
            current.arguments = v;
            cb.inputEl.setTooltip(current.arguments);
          }
        });
        pandocSettingWatcher.watchOnChanged('arguments', (value) => {
          cb.setValue(value ?? '');
          cb.inputEl.setTooltip(value);
        });
      });
    settingWatcher.watchOnChanged('type', (value) => {
      argumentsSetting.settingEl.setVisible(value === 'pandoc');
    });

    const customArgumentsSetting = new Setting(containerEl)
      .setName(lang.extraArguments)
      .addText(cb => {
        cb.onChange(v => {
          if (current.type === 'pandoc' && current.customArguments !== v) {
            current.customArguments = v;
          }
        });
        pandocSettingWatcher.watchOnChanged('customArguments', (value) => {
          cb.setValue(value ?? '');
          cb.inputEl.setTooltip(value);
        });
      });
    settingWatcher.watchOnChanged('type', (value) => {
      customArgumentsSetting.settingEl.setVisible(value === 'pandoc');
    });

    new Setting(containerEl)
      .setName(lang.afterExport)
      .setHeading();

    const showCommandOutputSetting = new Setting(containerEl)
      .setName(lang.showCommandOutput)
      .addToggle(cb => {
        
        if (current.type === 'custom') {
          cb.setValue(current.showCommandOutput);
        }
        cb.onChange(v => {
          if (current.type === 'custom' && current.showCommandOutput !== v) {
            current.showCommandOutput = v;
          }
        });
      });
    settingWatcher.watchOnChanged('type', (value) => {
      showCommandOutputSetting.settingEl.setVisible(value === 'custom');
    });


    new Setting(containerEl)
      .setName(lang.openExportedFileLocation)
      .addToggle(cb => {
        cb.onChange(v => {
          if (current.openExportedFileLocation !== v) {
            current.openExportedFileLocation = v;
          }
        });
        
        settingWatcher.watchOnChanged('openExportedFileLocation', (value) => {
          cb.setValue(value);
        });
        
      });

    new Setting(containerEl)
      .setName(lang.runCommand)
      .addToggle(cb => {
        cb.onChange((v) => {
          if (current.type === 'pandoc' && current.runCommand !== v) {
            current.runCommand = v;
          }
        });
        pandocSettingWatcher.watchOnChanged('runCommand', (value) => {
          cb.setValue(value);
        });
      });
    

    const commandAfterExportSetting = new Setting(containerEl)
      .addText(cb => {
        cb.onChange((v) => {
          if (current.command !== v) {
            current.command = v;
          }
        } );
        
        pandocSettingWatcher.watchOnChanged('command', (value) => {
          cb.setValue(value);
        });

        pandocSettingWatcher.watchOnChanged('runCommand', (value, _, target) => {
          commandAfterExportSetting.settingEl.setVisible(target.type === 'pandoc' && value);
          cb.setValue(current.command);
        });
      });
    globalSettingWatcher.fireChanged(globalSetting);
    settingWatcher.fireChanged(current);
  }

}