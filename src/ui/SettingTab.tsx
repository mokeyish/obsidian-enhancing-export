import * as ct from 'electron';
import process from 'process';
import { PluginSettingTab } from 'obsidian';
import type { SemVer } from 'semver'
import type UniversalExportPlugin from '../main';
import {
  CustomExportSetting,
  ExportSetting,
  PandocExportSetting,
  createEnv,
  DEFAULT_ENV
} from '../settings';
import { setPlatformValue, getPlatformValue } from '../utils';

import { createSignal, createRoot, onCleanup, createMemo, createEffect, Show, batch, Match, Switch, JSX } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { insert, Dynamic } from 'solid-js/web';
import type { Lang } from '../lang';

import pandoc from '../pandoc';
import Modal from './components/Modal';
import Button from './components/Button';
import Setting, { Text, Toggle, ExtraButton, DropDown, TextArea } from './components/Setting';
import export_templates from '../export_templates';


const SettingTab = (props: { lang: Lang, plugin: UniversalExportPlugin }) => {
  const { plugin, lang } = props;
  const [settings, setSettings0] = createStore(plugin.settings);
  const [pandocVersion, setPandocVersion] = createSignal<SemVer>();
  const envVars = createMemo(() => Object.entries(Object.assign({}, getPlatformValue(DEFAULT_ENV), getPlatformValue(settings.env) ?? {})).map(([n, v]) => `${n}="${v}"`).join('\n'));
  const setSettings: typeof setSettings0 = (...args: unknown[]) => {
    (setSettings0 as ((...args: unknown[]) => void))(...args);
    plugin.saveSettings();
  };
  const setEnvVars = (envItems: string) => {
    try {
      const env: Record<string, string> = {};
      for (let line of envItems.split('\n')) {
        line = line.trim();
        const sepIdx = line.indexOf('=');
        if (sepIdx > 0) {
          const name = line.substring(0, sepIdx);
          let value = line.substring(sepIdx + 1).trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }
          env[name] = value;
        }
      }
      setSettings('env', setPlatformValue(settings.env ?? {}, env));
    } catch (e) {
      alert(e);
    }
  };

  const currentCommandTemplate = createMemo(() => settings.items.find(v => v.name === settings.lastEditName) ?? settings.items.first());
  const currentEditCommandTemplate = <T extends 'custom' | 'pandoc'>(type?: T) => {
    const template = currentCommandTemplate();
    return (type === undefined || type === template.type ? template : undefined) as T extends 'custom' ? CustomExportSetting : T extends 'pandoc' ? PandocExportSetting : ExportSetting;
  };
  const customDefaultExportDirectory = createMemo(() => getPlatformValue(settings.customDefaultExportDirectory));

  const updateCurrentEditCommandTemplate = (update: (prev: Partial<ExportSetting>) => void) => {
    const idx = settings.items.findIndex(v => v.name === settings.lastEditName);
    setSettings('items', idx === -1 ? 0 : idx, produce(item => {
      update(item);
      return item;
    }));
  };

  const pandocDescription = createMemo(() => {
    const version = pandocVersion();
    if (version) {
      if (app.vault.config.useMarkdownLinks && version.compare(pandoc.requiredVersion) === -1) {
        return lang.settingTab.pandocVersionWithWarning(pandoc.requiredVersion)
      }
      return lang.settingTab.pandocVersion(version)
    }
    return lang.settingTab.pandocNotFound;
  });

  const [modal, setModal] = createSignal<() => JSX.Element>();

  const AddCommandTemplateModal = () => {
    type TemplateKey = keyof typeof export_templates;
    const [templateName, setTemplateName] = createSignal(Object.keys(export_templates)[0] as TemplateKey);
    const [name, setName] = createSignal<string>();
    const doAdd = () => {
      const template = JSON.parse(JSON.stringify(export_templates[templateName()]));
      template.name = name();
      batch(() => {
        setSettings('items', items => [...items, template]);
        setSettings('lastEditName', template.name);
      });
      setModal(undefined);
    };
    return <>
      <Modal app={app} title={lang.settingTab.new} onClose={() => setModal(undefined)}>
        <Setting name={lang.settingTab.template}>
          <DropDown
            options={Object.entries(export_templates).map(([k, v]) => ({ name: v.name, value: k }))}
            selected={name() ?? templateName()}
            onChange={(v: TemplateKey) => setTemplateName(v)}
          />
        </Setting>
        <Setting name={lang.settingTab.name}>
          <Text value={name() ?? ''} onChange={(value) => setName(value)} />
        </Setting>
        <div class="modal-button-container">
          <Button cta={true} onClick={doAdd}>{lang.settingTab.save}</Button>
        </div>
      </Modal>
    </>;
  };

  const RenameCommandTemplateModal = () => {
    const [name, setName] = createSignal(currentEditCommandTemplate().name);
    const doRename = () => {
      batch(() => {
        updateCurrentEditCommandTemplate((v) => v.name = name());
        setSettings('lastEditName', name());
      });
      setModal(undefined);
    };
    return <>
      <Modal app={app} title={lang.settingTab.rename} onClose={() => setModal(undefined)}>
        <Setting name={lang.settingTab.name}>
          <Text value={name() ?? ''} onChange={(value) => setName(value)} />
        </Setting>
        <div class="modal-button-container">
          <Button cta={true} onClick={doRename}>{lang.settingTab.add}</Button>
        </div>
      </Modal>
    </>;
  };

  const PandocCommandTempateEditBlock = () => {
    const template = () => currentEditCommandTemplate('pandoc');
    const updateTemplate = (update: (prev: Partial<PandocExportSetting>) => void) => {
      updateCurrentEditCommandTemplate(prev => prev.type === 'pandoc' ? update(prev) : undefined);
    };
    return <>
      <Setting name={lang.settingTab.arguments}>
        <Text style="width: 100%" value={template().arguments ?? ''} onChange={(value) => updateTemplate(v => v.arguments = value)} />
      </Setting>
      <Setting name={lang.settingTab.extraArguments}>
        <Text style="width: 100%" value={template().customArguments ?? ''} title={template().customArguments} onChange={(value) => updateTemplate(v => v.customArguments = value)} />
      </Setting>

      <Setting name={lang.settingTab.afterExport} heading={true} />
      <Setting name={lang.settingTab.openExportedFileLocation}>
        <Toggle checked={template().openExportedFileLocation ?? false} onChange={(checked) => updateTemplate(v => v.openExportedFileLocation = checked)} />
      </Setting>
      <Setting name={lang.settingTab.openExportedFile}>
        <Toggle checked={template().openExportedFile ?? false} onChange={(checked) => updateTemplate(v => v.openExportedFile = checked)} />
      </Setting>
      <Setting name={lang.settingTab.runCommand}>
        <Toggle checked={template().runCommand} onChange={(checked) => updateTemplate(v => v.runCommand = checked)} />
      </Setting>
      <Show when={template().runCommand}>
        <Setting>
          <Text style="width: 100%" value={template().command ?? ''} onChange={(value) => updateTemplate(v => v.command = value)} />
        </Setting>
      </Show>
    </>;
  };

  const CustomCommandTempateEditBlock = () => {
    const template = () => currentEditCommandTemplate('custom');
    const updateTemplate = (update: (prev: Partial<CustomExportSetting>) => void) => {
      updateCurrentEditCommandTemplate(prev => prev.type === 'custom' ? update(prev) : undefined);
    };
    return <>
      <Setting name={lang.settingTab.command}>
        <Text style="width: 100%" value={template().command} onChange={(value) => updateTemplate(v => v.command = value)} />
      </Setting>
      <Setting name={lang.settingTab.targetFileExtensions}>
        <Text value={template().targetFileExtensions ?? ''} onChange={(value) => updateTemplate(v => v.targetFileExtensions = value)} />
      </Setting>

      <Setting name={lang.settingTab.afterExport} heading={true} />
      <Setting name={lang.settingTab.showCommandOutput} >
        <Toggle checked={template().showCommandOutput ?? false} onChange={(checked) => updateTemplate(v => v.showCommandOutput = checked)} />
      </Setting>
      <Setting name={lang.settingTab.openExportedFileLocation}>
        <Toggle checked={template().openExportedFileLocation ?? false} onChange={(checked) => updateTemplate(v => v.openExportedFileLocation = checked)} />
      </Setting>
      <Setting name={lang.settingTab.openExportedFile}>
        <Toggle checked={template().openExportedFile ?? false} onChange={(checked) => updateTemplate(v => v.openExportedFile = checked)} />
      </Setting>
    </>;
  };

  const resetSettings = async () => {
    await plugin.resetSettings();
    setSettings(plugin.settings);
  };

  const chooseCustomDefaultExportDirectory = async () => {
    const retval = await ct.remote.dialog.showOpenDialog({
      defaultPath: customDefaultExportDirectory() ?? ct.remote.app.getPath('documents'),
      properties: ['createDirectory', 'openDirectory'],
    });

    if (!retval.canceled && retval.filePaths.length > 0) {
      setSettings('customDefaultExportDirectory', v => setPlatformValue(v, retval.filePaths[0]));
    }
  };

  const choosePandocPath = async () => {
    const retval = await ct.remote.dialog.showOpenDialog({
      filters: process.platform == 'win32' ? [{ extensions: ['exe'], name: 'pandoc' }]: undefined,
      properties: ['openFile'],
    });

    if (!retval.canceled && retval.filePaths.length > 0) {
      setSettings('pandocPath', (v) => setPlatformValue(v, retval.filePaths[0]));
    }
  };

  createEffect(async () => {
    try {
      const env = createEnv(getPlatformValue(settings.env) ?? {});
      setPandocVersion(await pandoc.getVersion(getPlatformValue(settings.pandocPath), env));
    } catch {
      setPandocVersion(undefined);
    }
  });

  return <>
    <Setting name={lang.settingTab.general} heading={true}>
      <ExtraButton icon='reset' onClick={resetSettings} />
    </Setting>

    <Setting name={lang.settingTab.pandocPath} description={pandocDescription()}>
      <Text
        placeholder={lang.settingTab.pandocPathPlaceholder}
        value={getPlatformValue(settings.pandocPath) ?? ''}
        onChange={(value) => setSettings('pandocPath', (v) => setPlatformValue(v, value))}
      />
      <ExtraButton icon="folder" onClick={choosePandocPath} />
    </Setting>

    <Setting name={lang.settingTab.defaultFolderForExportedFile}>
      <DropDown options={[
        { name: lang.settingTab.auto, value: 'Auto' },
        { name: lang.settingTab.sameFolderWithCurrentFile, value: 'Same' },
        { name: lang.settingTab.customLocation, value: 'Custom' }
      ]} selected={settings.defaultExportDirectoryMode} onChange={(v: 'Auto' | 'Same' | 'Custom') => setSettings('defaultExportDirectoryMode', v)} />

    </Setting>

    <Show when={settings.defaultExportDirectoryMode === 'Custom'}>
      <Setting>
        <Text value={customDefaultExportDirectory() ?? ''} title={customDefaultExportDirectory()} />
        <ExtraButton icon="folder" onClick={chooseCustomDefaultExportDirectory} />
      </Setting>
    </Show>

    <Setting name={lang.settingTab.openExportedFileLocation}>
      <Toggle
        checked={settings.openExportedFileLocation}
        onChange={(v) => setSettings('openExportedFileLocation', v)}
      />
    </Setting>

    <Setting name={lang.settingTab.openExportedFile} >
      <Toggle
        checked={settings.openExportedFile}
        onChange={(v) => setSettings('openExportedFile', v)} />
    </Setting>

    
    <Setting name={lang.settingTab.ShowExportProgressBar}>
      <Toggle
        checked={settings.showExportProgressBar}
        onChange={(v) => setSettings('showExportProgressBar', v)}
      />
    </Setting>

    <Setting name={lang.settingTab.editCommandTemplate} heading={true} />

    <Setting name={lang.settingTab.chooseCommandTemplate}>
      <DropDown
        options={settings.items.map(o => ({ name: o.name, value: o.name }))}
        selected={settings.lastEditName}
        onChange={(v) => setSettings('lastEditName', v)}
      />
      <ExtraButton
        icon="plus"
        tooltip={lang.settingTab.add}
        onClick={() => setModal(() => AddCommandTemplateModal)} />
      <ExtraButton
        icon="pencil"
        tooltip={lang.settingTab.rename}
        onClick={() => setModal(() => RenameCommandTemplateModal)} />
      <ExtraButton
        icon="trash"
        tooltip={lang.settingTab.remove}
        onClick={() => batch(() => {
          setSettings('items', (items) => items.filter(n => n.name !== currentEditCommandTemplate()?.name));
          setSettings('lastEditName', settings.items.first()?.name);
        })} />
    </Setting>

    <Switch>
      <Match when={currentEditCommandTemplate('pandoc')}>
        <PandocCommandTempateEditBlock />
      </Match>
      <Match when={currentEditCommandTemplate('custom')}>
        <CustomCommandTempateEditBlock />
      </Match>
    </Switch>


    <Setting name={lang.settingTab.advanced} heading={true} />

    {/* TODO:// optimize UI as https://www.jetbrains.com/help/idea/absolute-path-variables.html */}
    <Setting name={lang.settingTab.environmentVariables} description={lang.settingTab.environmentVariablesDesc}>
      <TextArea
        style='width: 100%;height: 5em'
        value={envVars()}
        onChange={setEnvVars}
      />
    </Setting>

    <Show when={modal()}>
      <Dynamic component={modal()} ref={(el: Node) => document.body.appendChild(el)} />
    </Show>
  </>;
};


export default class extends PluginSettingTab {
  plugin: UniversalExportPlugin;
  #dispose?: () => void;

  public get lang() {
    return this.plugin.lang;
  }

  constructor(plugin: UniversalExportPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
    this.name = this.plugin.lang.settingTab.title;
  }

  display() {
    this.#dispose = createRoot(dispose => {
      insert(this.containerEl, <SettingTab plugin={this.plugin} lang={this.lang} />);
      onCleanup(() => {
        this.containerEl.empty();
      });
      return dispose;
    });
  }

  hide() {
    this.#dispose();
  }
}