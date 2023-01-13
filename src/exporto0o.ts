import { getPlatformValue, Variables, ExportSetting, extractDefaultExtension as extractExtension } from './settings';
import * as ct from 'electron';
import { MessageBox } from './ui/message_box';
import { Notice, TFile } from 'obsidian';
import * as fs from 'fs';
import type ExportPlugin from './main';
import { exec } from 'child_process';
import path from 'path';
import yargs from 'yargs/yargs';

export async function exportToOo(
  plugin: ExportPlugin,
  currentFile: TFile,
  candidateOutputDirectory: string,
  candidateOutputFileName: string | undefined,
  setting: ExportSetting,
  showOverwriteConfirmation?: boolean,
  onSuccess?: () => void,
  onFailure?: () => void,
  beforeExport?: () => void
) {
  const {
    settings: globalSetting,
    lang,
    manifest,
    app: {
      vault: { adapter, config: obsidianConfig },
      loadProgress: progress,
    },
  } = plugin;

  if (!candidateOutputFileName) {
    const extension = extractExtension(setting);
    candidateOutputFileName = `${currentFile.basename}${extension}`;
  }
  if (showOverwriteConfirmation == undefined) {
    showOverwriteConfirmation = globalSetting.showOverwriteConfirmation;
  }

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
  const vaultDir = adapter.getBasePath();
  const pluginDir = `${vaultDir}/${manifest.dir}`;
  const luaDir = `${pluginDir}/lua`;
  const outputDir = candidateOutputDirectory;
  const outputPath = `${outputDir}/${candidateOutputFileName}`;
  const outputFileName = candidateOutputFileName.substring(0, candidateOutputFileName.lastIndexOf('.'));
  const outputFileFullName = candidateOutputFileName;

  const currentPath = adapter.getFullPath(currentFile.path);
  const currentDir = currentPath.substring(0, currentPath.length - currentFile.name.length - 1);
  const currentFileName = currentFile.basename;
  const currentFileFullName = currentFile.name;

  let attachmentFolderPath = obsidianConfig.attachmentFolderPath ?? '/';
  if (attachmentFolderPath === '/') {
    attachmentFolderPath = vaultDir;
  } else if (attachmentFolderPath.startsWith('.')) {
    attachmentFolderPath = path.join(currentDir, attachmentFolderPath.substring(1));
  }

  const variables: Variables = {
    pluginDir,
    luaDir,
    outputDir,
    outputPath,
    outputFileName,
    outputFileFullName,
    currentDir,
    currentPath,
    currentFileName,
    currentFileFullName,
    attachmentFolderPath,
    vaultDir,
    // date: new Date(currentFile.stat.ctime),
    // lastMod: new Date(currentFile.stat.mtime),
    // now: new Date()
  };

  switch (ct.remote.process.platform) {
    case 'darwin': {
      let envPath = ct.remote.process.env['PATH'];
      const extraBins = ['/usr/local/bin', '/Library/TeX/texbin'];
      for (const bin of extraBins) {
        if (envPath.includes(bin)) continue;
        envPath = `${bin}:${envPath}`;
      }
      ct.remote.process.env['PATH'] = envPath;
      break;
    }
    default:
      break;
  }

  const showCommandLineOutput = setting.type === 'custom' && setting.showCommandOutput;
  const openExportedFileLocation = setting.openExportedFileLocation ?? globalSetting.openExportedFileLocation;
  const openExportedFile = setting.openExportedFile ?? globalSetting.openExportedFile;

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

    if (result.canceled) {
      return;
    }

    variables.outputPath = result.filePath;
    variables.outputDir = variables.outputPath.substring(0, variables.outputPath.lastIndexOf('/'));
    variables.outputFileFullName = variables.outputPath.substring(variables.outputDir.length + 1);
    variables.outputFileName = variables.outputFileFullName.substring(0, variables.outputFileFullName.lastIndexOf('.'));
  }

  // show progress
  progress.setMessage(lang.preparing(outputFileFullName));
  beforeExport && beforeExport();
  progress.show();

  const pandocPath = getPlatformValue(globalSetting.pandocPath) ?? 'pandoc';

  const cmdTpl =
    setting.type === 'pandoc'
      ? `${pandocPath} ${setting.arguments ?? ''} ${setting.customArguments ?? ''} "${currentPath}"`
      : setting.command;

  const cmd = cmdTpl.replace(/\${(.*?)}/g, (_, p1: string) => variables[p1 as keyof typeof variables]);

  const args = await yargs(cmd.match(/(?:[^\s"]+|"[^"]*")+/g)).options({
    output: { type: 'string', alias: 'o' },
  }).argv;
  const actualOutputPath =
    (args.output.startsWith('"') && args.output.endsWith('"')) || (args.output.startsWith("'") && args.output.endsWith("'"))
      ? args.output.substring(1, args.output.length - 1)
      : args.output;

  const actualOutputDir = actualOutputPath.substring(0, actualOutputPath.lastIndexOf('/'));
  if (!fs.existsSync(actualOutputDir)) {
    fs.mkdirSync(actualOutputDir);
  }

  executeCommand(
    cmd,
    () => {
      progress.hide();

      const next = async () => {
        if (openExportedFileLocation) {
          setTimeout(() => {
            ct.remote.shell.showItemInFolder(actualOutputPath);
          }, 1000);
        }
        if (openExportedFile) {
          await ct.remote.shell.openPath(actualOutputPath);
        }
        if (setting.type === 'pandoc' && setting.runCommand === true && setting.command) {
          executeCommand(setting.command);
        }
        // success
        onSuccess && onSuccess();
      };

      if (showCommandLineOutput) {
        const box = new MessageBox(app, lang.exportCommandOutputMessage(cmd));
        box.onClose = next;
        box.open();
      } else {
        new Notice(lang.exportSuccessNotice(outputFileFullName), 1500);
        next();
      }
    },
    err => {
      progress.hide();
      new MessageBox(app, lang.exportErrorOutputMessage(cmd, err)).open();
      onFailure && onFailure();
    }
  );
}

const executeCommand = (cmd: string, successCallback?: (msg: string) => void, errorCallback?: (msg: string) => void) => {
  let options;
  if (ct.remote.process.platform === 'win32') {
    options = {};
  } else {
    options = { env: { PATH: ct.remote.process.env['PATH'] } };
  }
  exec(cmd, options, (error, stdout, stderr) => {
    if (error) {
      console.log(`cmd: ${cmd}\n error: ${error.message}`);
      if (errorCallback) {
        errorCallback(error.message);
      }
      return;
    }
    if (stderr) {
      console.log(`cmd: ${cmd}\n stderr: ${stderr}`);
      if (errorCallback) {
        errorCallback(stderr);
      }
      return;
    }
    console.log(`cmd: ${cmd}\n stdout: ${stdout}`);
    if (successCallback) {
      successCallback(stdout);
    }
  });
};
