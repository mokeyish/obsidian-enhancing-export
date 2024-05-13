import * as ct from 'electron';
import * as fs from 'fs';
import process from 'process';
import path from 'path';
import argsParser from 'yargs-parser';
import { Variables, ExportSetting, extractDefaultExtension as extractExtension, createEnv } from './settings';
import { MessageBox } from './ui/message_box';
import { Notice, TFile } from 'obsidian';
import { exec, renderTemplate, getPlatformValue, trimQuotes } from './utils';
import type ExportPlugin from './main';
import pandoc from './pandoc';

export async function exportToOo(
  plugin: ExportPlugin,
  currentFile: TFile,
  candidateOutputDirectory: string,
  candidateOutputFileName: string | undefined,
  setting: ExportSetting,
  showOverwriteConfirmation?: boolean,
  options?: unknown,
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
      metadataCache,
    },
  } = plugin;

  if (!candidateOutputFileName) {
    const extension = extractExtension(setting);
    candidateOutputFileName = `${currentFile.basename}${extension}`;
  }
  if (showOverwriteConfirmation == undefined) {
    showOverwriteConfirmation = globalSetting.showOverwriteConfirmation;
  }

  const showExportProgressBar = globalSetting.showExportProgressBar;

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
  const currentDir = path.dirname(currentPath);
  const currentFileName = currentFile.basename;
  const currentFileFullName = currentFile.name;

  let attachmentFolderPath = obsidianConfig.attachmentFolderPath ?? '/';
  if (attachmentFolderPath === '/') {
    attachmentFolderPath = vaultDir;
  } else if (attachmentFolderPath.startsWith('.')) {
    attachmentFolderPath = path.join(currentDir, attachmentFolderPath.substring(1));
  } else {
    attachmentFolderPath = path.join(vaultDir, attachmentFolderPath);
  }

  let frontMatter: unknown = null;
  try {
    frontMatter = metadataCache.getCache(currentFile.path).frontmatter;
  } catch (e) {
    console.error(e);
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
    metadata: frontMatter,
    options,
    fromFormat: app.vault.config.useMarkdownLinks ? 'markdown' : 'markdown+wikilinks_title_after_pipe',
  };

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
    variables.outputDir = path.dirname(variables.outputPath);
    variables.outputFileFullName = path.basename(variables.outputPath);
    variables.outputFileName = path.basename(variables.outputFileFullName, path.extname(variables.outputFileFullName));
  }

  // show progress
  if (showExportProgressBar) {
    progress.setMessage(lang.preparing(variables.outputFileFullName));
    beforeExport?.();
    progress.show();
  }

  // process Environment variables..
  const env = (variables.env = createEnv(getPlatformValue(globalSetting.env) ?? {}, variables));

  let pandocPath = pandoc.normalizePath(getPlatformValue(globalSetting.pandocPath));

  if (process.platform === 'win32') {
    // https://github.com/mokeyish/obsidian-enhancing-export/issues/153
    pandocPath = pandocPath.replaceAll('\\', '/');
    const pathKeys: Array<keyof Variables> = [
      'pluginDir',
      'luaDir',
      'outputDir',
      'outputPath',
      'currentDir',
      'currentPath',
      'attachmentFolderPath',
      'vaultDir',
    ];

    for (const pathKey of pathKeys) {
      const path = variables[pathKey] as string;
      variables[pathKey] = path.replaceAll('\\', '/');
    }
  }

  const cmdTpl =
    setting.type === 'pandoc'
      ? `${pandocPath} "\${currentPath}" ${setting.arguments ?? ''} ${setting.customArguments ?? ''}`
      : setting.command;

  const cmd = renderTemplate(cmdTpl, variables);
  const args = argsParser(cmd.match(/(?:[^\s"]+|"[^"]*")+/g), {
    alias: {
      output: ['o'],
    },
  });
  const actualOutputPath = path.normalize(trimQuotes(args.output));

  const actualOutputDir = path.dirname(actualOutputPath);
  if (!fs.existsSync(actualOutputDir)) {
    fs.mkdirSync(actualOutputDir);
  }

  try {
    console.log(`[${plugin.manifest.name}]: export command and options:`, {
      cmd,
      options: { cwd: variables.currentDir, env },
    });
    await exec(cmd, { cwd: variables.currentDir, env });
    if (showExportProgressBar) {
      progress.hide();
    }

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
        const extCmd = renderTemplate(setting.command, variables);
        await exec(extCmd, { cwd: variables.currentDir, env });
      }
      // success
      onSuccess && onSuccess();
    };

    if (showCommandLineOutput) {
      const box = new MessageBox(app, lang.exportCommandOutputMessage(cmd));
      box.onClose = next;
      box.open();
    } else {
      new Notice(lang.exportSuccessNotice(variables.outputFileFullName), 1500);
      await next();
    }
  } catch (err) {
    progress.hide();
    new MessageBox(app, lang.exportErrorOutputMessage(cmd, err)).open();
    onFailure && onFailure();
  }
}
