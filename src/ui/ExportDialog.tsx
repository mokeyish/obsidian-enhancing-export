import * as ct from 'electron';
import { TFile } from 'obsidian';
import { createSignal, createRoot, onCleanup, createMemo, untrack, createEffect, Show } from 'solid-js';
import { insert } from 'solid-js/web';
import type UniversalExportPlugin from '../main';
import { extractDefaultExtension as extractExtension, finalizeOptionsMeta } from '../settings';
import { setPlatformValue, getPlatformValue, } from '../utils';
import { exportToOo } from '../exporto0o';
import Modal from './components/Modal';
import Button from './components/Button';
import PropertyGrid, { createDefaultObject } from './components/PropertyGrid';
import Setting, {Text, DropDown, ExtraButton, Toggle} from './components/Setting';


const Dialog = (props: { plugin: UniversalExportPlugin, currentFile: TFile, onClose?: () => void }) => {
  const { plugin: { app, settings: globalSetting, lang }, currentFile } = props;

  const [hidden, setHidden] = createSignal(false);
  const [showOverwriteConfirmation, setShowOverwriteConfirmation] = createSignal(globalSetting.showOverwriteConfirmation);
  const [exportType, setExportType] = createSignal(globalSetting.lastExportType ?? globalSetting.items.first()?.name);
  const [options, setOptions] = createSignal({});
  const setting = createMemo(() => globalSetting.items.find(o => o.name === exportType()));
  const extension = createMemo(() => extractExtension(setting()));
  const title = createMemo(() => lang.exportDialog.title(setting().name));
  const optionsMeta = createMemo(() => finalizeOptionsMeta(setting().optionsMeta));

  const [candidateOutputDirectory, setCandidateOutputDirectory] = createSignal(`${getPlatformValue(globalSetting.lastExportDirectory) ?? ct.remote.app.getPath('documents')}`);
  const [candidateOutputFileName, setCandidateOutputFileName] = createSignal(`${currentFile.basename}${extension()}`);

  createEffect(() => {
    const meta = optionsMeta();
    setOptions(meta ? createDefaultObject(meta) : {});
  });

  createEffect(() => {
    let fileName = untrack(candidateOutputFileName);
    fileName =  fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
    setCandidateOutputFileName(`${fileName}${extension()}`);
  });

  const exportTypes = globalSetting.items.map(o => ({ name: o.name, value: o.name }));

  if (globalSetting.defaultExportDirectoryMode === 'Same') {
    const path = currentFile.vault.adapter.getBasePath() + '/' + currentFile.parent.path;
    setCandidateOutputDirectory(path);
  } else if (globalSetting.defaultExportDirectoryMode === 'Custom') {
    setCandidateOutputDirectory(getPlatformValue(globalSetting.customDefaultExportDirectory));
  }
  
  const chooseFolder = async () => {
    const retval = await ct.remote.dialog.showOpenDialog({
      title: lang.exportDialog.selectExportFolder,
      defaultPath: candidateOutputDirectory(),
      properties: ['createDirectory', 'openDirectory'],
    });
    if (!retval.canceled && retval.filePaths?.length > 0) {
      setCandidateOutputDirectory(retval.filePaths[0]);
    }
  };

  const doExport = async () => {
    const plugin = props.plugin;
    setHidden(true);
    await exportToOo(
      plugin,
      currentFile,
      untrack(candidateOutputDirectory),
      untrack(candidateOutputFileName),
      untrack(setting),
      untrack(showOverwriteConfirmation),
      options(),
      async () => {
        globalSetting.showOverwriteConfirmation = untrack(showOverwriteConfirmation);
        globalSetting.lastExportDirectory = setPlatformValue(globalSetting.lastExportDirectory, untrack(candidateOutputDirectory));

        globalSetting.lastExportType = untrack(setting).name;
        await plugin.saveSettings();
        props.onClose && props.onClose();
      },
      () => {
        setHidden(false);
      }
    );
  };

  return <>
    <Modal app={app} title={title()} hidden={hidden()} onClose={props.onClose} >
      <Setting name={lang.exportDialog.type}>
        <DropDown options={exportTypes} onChange={(typ) => setExportType(typ)} selected={exportType()}/>
      </Setting>

      <Setting name={lang.exportDialog.fileName}>
        <Text
          title={candidateOutputFileName()}
          value={candidateOutputFileName()}
          onChange={(value) => setCandidateOutputFileName(value)}
        />
      </Setting>

      <Show when={optionsMeta()}>
        <PropertyGrid meta={optionsMeta()} value={options()} onChange={ (o) => setOptions(o)}/>
      </Show>

      <Setting name={lang.exportDialog.exportTo}>
        <Text title={candidateOutputDirectory()} value={candidateOutputDirectory()} disabled />
        <ExtraButton icon='folder' onClick={chooseFolder} />
      </Setting>


      <Setting name={lang.exportDialog.overwriteConfirmation} class="mod-toggle">
        <Toggle checked={showOverwriteConfirmation()} onChange={setShowOverwriteConfirmation} />
      </Setting>

      <div class="modal-button-container">
        <Button cta={true} onClick={doExport}>{lang.exportDialog.export}</Button>
      </div>
    </Modal>
  </>;
};


const show = (plugin: UniversalExportPlugin, currentFile: TFile) => createRoot(dispose => {
  let disposed = false;
  const cleanup = () => {
    if (disposed) {
      return;
    }
    disposed = true;
    dispose();
  };
  const el = insert(document.body, () => <Dialog onClose={cleanup} plugin={plugin} currentFile={currentFile} />);
  onCleanup(() => {
    el instanceof Node && document.body.contains(el) && document.body.removeChild(el);
  });
  return cleanup;
});


export default {
  show
};