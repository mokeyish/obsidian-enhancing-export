import { App, Modal, Setting, TFile, TextComponent, Notice } from 'obsidian';
import * as ct from 'electron';
import {
  extractDefaultExtension as extractExtension,
  getPlatformValue,
  setPlatformValue,
  Variables,
} from '../settings';
import type UniversalExportPlugin from '../main';

import { exec } from 'child_process';
import { MessageBox } from './message_box';
import * as fs from 'fs';
import { setTooltip, setVisible } from '../utils';

export const executeCommand = (
  cmd: string,
  successCallback?: (msg: string) => void,
  errorCallback?: (msg: string) => void
) => {
  let options;
  if (ct.remote.process.platform === 'win32') {
    options = {};
  } else {
    options = { env: { PATH: ct.remote.process.env['PATH'] } };
  }
  exec(cmd, options, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      if (errorCallback) {
        errorCallback(error.message);
      }
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      if (errorCallback) {
        errorCallback(stderr);
      }
      return;
    }
    console.log(`stdout: ${stdout}`);
    if (successCallback) {
      successCallback(stdout);
    }
  });
};

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
      plugin: { settings: common },
      lang,
    } = this;

    const exportDirectoryMode = common.defaultExportDirectoryMode;

    let exportType = common.lastExportType ?? common.items.first()?.name;

    let setting = common.items.find(o => o.name === exportType);
    let extension = extractExtension(setting);

    let showOverwriteConfirmation = common.showOverwriteConfirmation;
    let candidateOutputDirectory = `${
      getPlatformValue(common.lastExportDirectory) ??
      ct.remote.app.getPath('documents')
    }`;
    let candidateOutputFileName = `${currentFile.basename}${extension}`;

    // eslint-disable-next-line prefer-const
    let candidateOutputFileNameSetting: Setting;

    if (exportDirectoryMode === 'Same') {
      const fullPath: string = this.app.vault.adapter.getFullPath(
        currentFile.path
      );
      candidateOutputDirectory = fullPath.substring(
        0,
        fullPath.length - currentFile.name.length - 1
      );
    } else if (exportDirectoryMode === 'Custom') {
      candidateOutputDirectory = getPlatformValue(
        common.customDefaultExportDirectory
      );
    }

    titleEl.setText(lang.exportDialog.title(setting.name));

    new Setting(contentEl).setName(lang.type).addDropdown(cb => {
      cb.addOptions(Object.fromEntries(common.items.map(o => [o.name, o.name])))
        .onChange(v => {
          exportType = v;
          setting = common.items.find(o => o.name === exportType);
          titleEl.setText(lang.exportDialog.title(setting.name));

          extension = extractExtension(setting);
          if (candidateOutputFileName.includes('.')) {
            candidateOutputFileName =
              candidateOutputFileName.substring(
                0,
                candidateOutputFileName.lastIndexOf('.')
              ) + extension;
          } else {
            candidateOutputFileName = candidateOutputFileName + extension;
          }
          (candidateOutputFileNameSetting.components.first() as TextComponent)
            ?.setValue(candidateOutputFileName)
            .inputEl.setAttribute('title', candidateOutputFileName);
        })
        .setValue(exportType);
    });

    candidateOutputFileNameSetting = new Setting(contentEl)
      .setName(lang.fileName)
      .addText(cb => {
        cb.setValue(candidateOutputFileName)
          .onChange(v => {
            candidateOutputFileName = v;
            setTooltip(cb.inputEl, v);
          })
          .inputEl.setAttribute('title', candidateOutputFileName);
      });

    const candidateOutputDirectorySetting = new Setting(contentEl)
      .setName(lang.exportTo)
      .setDisabled(true)
      .addText(cb => {
        cb.setValue(candidateOutputDirectory).onChange(v => {
          candidateOutputDirectory = v;
          setTooltip(cb.inputEl, candidateOutputDirectory);
        });
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
            (
              candidateOutputDirectorySetting.components.first() as TextComponent
            )
              ?.setValue(candidateOutputDirectory)
              .inputEl.setAttribute('title', candidateOutputDirectory);
          }
        });
      });

    new Setting(contentEl).setName(lang.overwriteConfirmation).addToggle(cb => {
      cb.setValue(showOverwriteConfirmation).onChange(
        v => (showOverwriteConfirmation = v)
      );
    });

    contentEl.createEl(
      'div',
      { cls: ['modal-button-container'], parent: contentEl },
      el => {
        el.createEl('button', {
          text: lang.exportDialog.export,
          cls: ['mod-cta'],
          parent: el,
        }).onclick = async () => {
          /* Variables
           *   /User/aaa/Documents/test.pdf
           * - ${outputDir}             --> /User/aaa/Documents/
           * - ${outputPath}            --> /User/aaa/Documents/test.pdf
           * - ${outputFileName}        --> test
           * - ${outputFileFullName}    --> test.pdf
           *
           *   /User/aaa/Documents/test.pdf
           * - ${currentDir}            --> /User/aaa/Documents/
           * - ${currentPath}           --> /User/aaa/Documents/test.pdf
           * - ${CurrentFileName}       --> test
           * - ${CurrentFileFullName}   --> test.pdf
           */

          const pluginDir = `${this.app.vault.adapter.getBasePath()}/${
            this.plugin.manifest.dir
          }`;
          const outputDir = candidateOutputDirectory;
          const outputPath = `${outputDir}/${candidateOutputFileName}`;
          const outputFileName = candidateOutputFileName.substring(
            0,
            candidateOutputFileName.lastIndexOf('.')
          );
          const outputFileFullName = candidateOutputFileName;

          const currentPath = this.app.vault.adapter.getFullPath(
            currentFile.path
          );
          const currentDir = currentPath.substring(
            0,
            currentPath.length - currentFile.name.length - 1
          );
          const currentFileName = currentFile.basename;
          const currentFileFullName = currentFile.name;

          const variables: Variables = {
            pluginDir,
            outputDir,
            outputPath,
            outputFileName,
            outputFileFullName,
            currentDir,
            currentPath,
            currentFileName,
            currentFileFullName,
            // date: new Date(currentFile.stat.ctime),
            // lastMod: new Date(currentFile.stat.mtime),
            // now: new Date()
          };

          switch (ct.remote.process.platform) {
            case 'darwin': {
              let envPath = ct.remote.process.env['PATH'];
              const brewBin = '/usr/local/bin';
              if (!envPath.includes(brewBin)) {
                envPath = `${brewBin}:${envPath}`;
                ct.remote.process.env['PATH'] = envPath;
              }
              break;
            }
            default:
              break;
          }

          const showCommandLineOutput =
            setting.type === 'custom' && setting.showCommandOutput;
          const openExportedFileLocation =
            setting.openExportedFileLocation ?? common.openExportedFileLocation;
          const openExportedFile =
            setting.openExportedFile ?? common.openExportedFile;

          const onExportSuccess = async () => {
            if (openExportedFileLocation) {
              setTimeout(() => {
                ct.remote.shell.showItemInFolder(outputPath);
              }, 1000);
            }
            if (openExportedFile) {
              await ct.remote.shell.openPath(outputPath);
            }
            // success
            this.plugin.settings.showOverwriteConfirmation =
              showOverwriteConfirmation;
            this.plugin.settings.lastExportDirectory = setPlatformValue(
              this.plugin.settings.lastExportDirectory,
              candidateOutputDirectory
            );

            this.plugin.settings.lastExportType = exportType;
            await this.plugin.saveSettings();
            this.close();
          };

          const doExport = () => {
            // show progress
            const progress = this.app.loadProgress;
            progress.setMessage(lang.preparing(outputFileFullName));
            setVisible(this.containerEl, false);
            progress.show();

            const pandocPath = getPlatformValue(common.pandocPath) ?? 'pandoc';

            const cmdTpl =
              setting.type === 'pandoc'
                ? `${pandocPath} ${setting.arguments ?? ''} ${
                    setting.customArguments ?? ''
                  } "${currentPath}"`
                : setting.command;

            const cmd = cmdTpl.replace(/\${(.*?)}/g, (_, p1: string) => {
              return variables[p1 as keyof typeof variables];
            });

            // console.log('export command:' + cmd);

            executeCommand(
              cmd,
              () => {
                progress.hide();
                if (showCommandLineOutput) {
                  const box = new MessageBox(
                    this.app,
                    lang.exportCommandOutputMessage(cmd)
                  );
                  box.onClose = onExportSuccess;
                  box.open();
                } else {
                  new Notice(
                    lang.exportSuccessNotice(outputFileFullName),
                    1500
                  );
                  onExportSuccess();
                }
              },
              err => {
                progress.hide();
                new MessageBox(
                  this.app,
                  lang.exportErrorOutputMessage(cmd, err)
                ).open();
                setVisible(this.containerEl, true);
              }
            );
          };

          if (showOverwriteConfirmation && fs.existsSync(outputPath)) {
            // const msgBox = new MessageBox(this.app, {
            //   message: lang.overwriteConfirmationDialog.message(outputDir),
            //   title: lang.overwriteConfirmationDialog.title(outputFileFullName),
            //   buttons: 'OkCancel',
            //   buttonsLabel: {
            //     ok: lang.overwriteConfirmationDialog.replace,
            //   },
            //   buttonsClass: {
            //     ok: 'mod-warning'
            //   },
            //   callback: {
            //     ok: () => doExport()
            //   }
            // });
            // msgBox.open();

            const result = await ct.remote.dialog.showSaveDialog({
              title: lang.overwriteConfirmationDialog.title(outputFileFullName),
              defaultPath: outputPath,
              properties: ['showOverwriteConfirmation', 'createDirectory'],
            });

            if (!result.canceled) {
              variables.outputPath = result.filePath;
              variables.outputDir = variables.outputPath.substring(
                0,
                variables.outputPath.lastIndexOf('/')
              );
              variables.outputFileFullName = variables.outputPath.substring(
                variables.outputDir.length + 1
              );
              variables.outputFileName = variables.outputFileFullName.substring(
                0,
                variables.outputFileFullName.lastIndexOf('.')
              );
              doExport();
            }
          } else {
            doExport();
          }
        };
      }
    );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
