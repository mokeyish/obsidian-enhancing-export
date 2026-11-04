import * as ct from 'electron';
import { TFile } from 'obsidian';
import { createSignal, createRoot, onCleanup, createMemo, untrack, createEffect, Show } from 'solid-js';
import { insert } from 'solid-js/web';
import type UniversalExportPlugin from '../main';
import { extractDefaultExtension as extractExtension, finalizeOptionsMeta, DocumentInfo } from '../settings';
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
  const [extraArguments, setExtraArguments] = createSignal('');
  const setting = createMemo(() => globalSetting.items.find(o => o.name === exportType()));
  const extension = createMemo(() => extractExtension(setting()));
  const title = createMemo(() => lang.exportDialog.title(setting().name));
  const optionsMeta = createMemo(() => finalizeOptionsMeta(setting().optionsMeta));

  const [candidateOutputDirectory, setCandidateOutputDirectory] = createSignal(`${getPlatformValue(globalSetting.lastExportDirectory) ?? ct.remote.app.getPath('documents')}`);
  const [candidateOutputFileName, setCandidateOutputFileName] = createSignal(`${currentFile.basename}${extension()}`);

  // Paper metadata: prefill from the note front matter, then from the last used
  // values, so users can fill/override it right in the export dialog.
  const frontMatter = (app.metadataCache.getCache(currentFile.path)?.frontmatter ?? {}) as Record<string, unknown>;
  const asText = (value: unknown): string =>
    Array.isArray(value) ? value.join(', ') : value == null ? '' : String(value);
  const initialInfo = (key: keyof DocumentInfo): string =>
    asText(frontMatter[key]) || globalSetting.lastDocumentInfo?.[key] || '';
  const [documentInfo, setDocumentInfo] = createSignal<DocumentInfo>({
    title: initialInfo('title'),
    author: initialInfo('author'),
    institute: initialInfo('institute'),
    date: initialInfo('date'),
    keywords: initialInfo('keywords'),
  });
  const updateInfo = (key: keyof DocumentInfo) => (value: string) =>
    setDocumentInfo(prev => ({ ...prev, [key]: value }));

  createEffect(() => {
    const meta = optionsMeta();
    setOptions(meta ? createDefaultObject(meta) : {});
  });

  createEffect(() => {
    let fileName = untrack(candidateOutputFileName);
    fileName =  fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
    setCandidateOutputFileName(`${fileName}${extension()}`);
  });

  const exportTypes = globalSetting.items.map(o => ({ name: o.name, value: o.name })).sort((a, b) => a.name.localeCompare(b.name));

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
      untrack(extraArguments),
      async () => {
        globalSetting.showOverwriteConfirmation = untrack(showOverwriteConfirmation);
        globalSetting.lastExportDirectory = setPlatformValue(globalSetting.lastExportDirectory, untrack(candidateOutputDirectory));

        globalSetting.lastExportType = untrack(setting).name;
        globalSetting.lastDocumentInfo = untrack(documentInfo);
        await plugin.saveSettings();
        props.onClose && props.onClose();
      },
      () => {
        setHidden(false);
      },
      undefined,
      untrack(documentInfo)
    );
  };

  return <>
    <Modal app={app} title={title()} hidden={hidden()} onClose={props.onClose} classList={{ 'oee-export-modal': true }}>
      <div class="oee-export-dialog">
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

        <Show when={setting()?.type === 'pandoc'}>
          <Setting name={lang.exportDialog.documentInfo} heading={true} />
          <div class="oee-card oee-grid">
            <Setting class="oee-span-2" name={lang.exportDialog.paperTitle}>
              <Text value={documentInfo().title ?? ''} onChange={updateInfo('title')} />
            </Setting>
            <Setting name={lang.exportDialog.author}>
              <Text value={documentInfo().author ?? ''} onChange={updateInfo('author')} />
            </Setting>
            <Setting name={lang.exportDialog.institute}>
              <Text value={documentInfo().institute ?? ''} onChange={updateInfo('institute')} />
            </Setting>
            <Setting name={lang.exportDialog.date}>
              <Text value={documentInfo().date ?? ''} onChange={updateInfo('date')} />
            </Setting>
            <Setting name={lang.exportDialog.keywords}>
              <Text value={documentInfo().keywords ?? ''} onChange={updateInfo('keywords')} />
            </Setting>
          </div>

          <Setting name={lang.settingTab.advanced} heading={true} />
          <Setting name={lang.exportDialog.extraArguments}>
            <Text
              style="width: 100%"
              value={extraArguments()}
              onChange={(value) => setExtraArguments(value)}
            />
          </Setting>
        </Show>

        <Setting name={lang.exportDialog.overwriteConfirmation} class="mod-toggle">
          <Toggle checked={showOverwriteConfirmation()} onChange={setShowOverwriteConfirmation} />
        </Setting>

        <div class="modal-button-container">
          <Button cta={true} onClick={doExport}>{lang.exportDialog.export}</Button>
        </div>
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