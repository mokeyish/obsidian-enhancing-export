import { App, Modal, Setting, TFile, TextComponent } from 'obsidian';
import * as ct from 'electron';
import { extractDefaultExtension as extractExtension, getPlatformValue, setPlatformValue } from '../settings';
import type UniversalExportPlugin from '../main';
import { exportToOo } from '../exporto0o';
import { setTooltip, setVisible } from './setting_tab';

export class ExportDialog extends Modal {
  readonly plugin: UniversalExportPlugin;
  readonly currentFile: TFile;
  get lang() {
    return this.plugin.lang;
  }
  constructor(app: App, plugin: UniversalExportPlugin, currentFile: TFile) {
    super(app);
    this.plugin = plugin;
    this.currentFile = currentFile;
  }

  onOpen() {
    const {
      titleEl,
      contentEl,
      currentFile,
      plugin: { settings: globalSetting },
      lang,
    } = this;

    const exportDirectoryMode = globalSetting.defaultExportDirectoryMode;

    let exportType = globalSetting.lastExportType ?? globalSetting.items.first()?.name;

    let setting = globalSetting.items.find(o => o.name === exportType);
    let extension = extractExtension(setting);

    let showOverwriteConfirmation = globalSetting.showOverwriteConfirmation;
    let candidateOutputDirectory = `${getPlatformValue(globalSetting.lastExportDirectory) ?? ct.remote.app.getPath('documents')}`;
    let candidateOutputFileName = `${currentFile.basename}${extension}`;

    // eslint-disable-next-line prefer-const
    let candidateOutputFileNameSetting: Setting;

    if (exportDirectoryMode === 'Same') {
      const fullPath: string = this.app.vault.adapter.getFullPath(currentFile.path);
      candidateOutputDirectory = fullPath.substring(0, fullPath.length - currentFile.name.length - 1);
    } else if (exportDirectoryMode === 'Custom') {
      candidateOutputDirectory = getPlatformValue(globalSetting.customDefaultExportDirectory);
    }

    titleEl.setText(lang.exportDialog.title(setting.name));

    new Setting(contentEl).setName(lang.type).addDropdown(cb => {
      cb.addOptions(Object.fromEntries(globalSetting.items.map(o => [o.name, o.name])))
        .onChange(v => {
          exportType = v;
          setting = globalSetting.items.find(o => o.name === exportType);
          titleEl.setText(lang.exportDialog.title(setting.name));

          extension = extractExtension(setting);
          if (candidateOutputFileName.includes('.')) {
            candidateOutputFileName = candidateOutputFileName.substring(0, candidateOutputFileName.lastIndexOf('.')) + extension;
          } else {
            candidateOutputFileName = candidateOutputFileName + extension;
          }
          (candidateOutputFileNameSetting.components.first() as TextComponent)
            ?.setValue(candidateOutputFileName)
            .inputEl.setAttribute('title', candidateOutputFileName);
        })
        .setValue(exportType);
    });

    candidateOutputFileNameSetting = new Setting(contentEl).setName(lang.exportDialog.fileName).addText(cb => {
      cb.setValue(candidateOutputFileName)
        .onChange(v => {
          candidateOutputFileName = v;
          setTooltip(cb.inputEl, v);
        })
        .inputEl.setAttribute('title', candidateOutputFileName);
    });

    const candidateOutputDirectorySetting = new Setting(contentEl)
      .setName(lang.exportDialog.exportTo)
      .addText(cb => {
        cb.setValue(candidateOutputDirectory).onChange(v => {
          candidateOutputDirectory = v;
          setTooltip(cb.inputEl, candidateOutputDirectory);
        });
        cb.setDisabled(true);
        setTooltip(cb.inputEl, candidateOutputDirectory);
      })
      .addExtraButton(cb => {
        cb.setIcon('folder').onClick(async () => {
          const retval = await ct.remote.dialog.showOpenDialog({
            title: lang.selectExportFolder,
            defaultPath: candidateOutputDirectory,
            properties: ['createDirectory', 'openDirectory'],
          });
          if (!retval.canceled && retval.filePaths?.length > 0) {
            candidateOutputDirectory = retval.filePaths[0];
            (candidateOutputDirectorySetting.components.first() as TextComponent)
              ?.setValue(candidateOutputDirectory)
              .inputEl.setAttribute('title', candidateOutputDirectory);
          }
        });
      });

    new Setting(contentEl).setName(lang.exportDialog.overwriteConfirmation).addToggle(cb => {
      cb.setValue(showOverwriteConfirmation).onChange(v => (showOverwriteConfirmation = v));
    });

    contentEl.createEl('div', { cls: ['modal-button-container'], parent: contentEl }, el => {
      el.createEl('button', {
        text: lang.exportDialog.export,
        cls: ['mod-cta'],
        parent: el,
      }).onclick = async () => {
        await exportToOo(
          this.plugin,
          currentFile,
          candidateOutputDirectory,
          candidateOutputFileName,
          setting,
          showOverwriteConfirmation,
          async () => {
            globalSetting.showOverwriteConfirmation = showOverwriteConfirmation;
            globalSetting.lastExportDirectory = setPlatformValue(globalSetting.lastExportDirectory, candidateOutputDirectory);

            globalSetting.lastExportType = setting.name;
            await this.plugin.saveSettings();
            this.close();
          },
          () => {
            setVisible(this.containerEl, true);
          },
          () => {
            setVisible(this.containerEl, false);
          }
        );
      };
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

const show = (plugin: UniversalExportPlugin, currentFile: TFile) => {
  const dialog = new ExportDialog(plugin.app, plugin, currentFile);
  dialog.open();
  return () => dialog.close();
};

export default {
  show,
};
