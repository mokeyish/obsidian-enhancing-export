import { FileFilter, remote } from 'electron';
import { For, JSX, createEffect, createSignal, untrack } from 'solid-js';
import Setting, { Toggle, DropDown, Text, ExtraButton } from './Setting';


const editors = {
  checkbox: (props: { meta: CheckboxMeta, onChange?: (value: unknown) => void }) => {
    return <>
      <Setting name={props.meta.title} description={props.meta.description}>
        <Toggle checked={getDefaultValue(props.meta)} onChange={props.onChange} />
      </Setting>
    </>;
  },
  textInput: (props: { meta: TextInputMeta, onChange?: (value: unknown) => void }) => {
    return <>
      <Setting name={props.meta.title} description={props.meta.description}>
        <Text value={getDefaultValue(props.meta)} onChange={props.onChange} />
      </Setting>
    </>;
  },
  dropdown: (props: { meta: DropDownMeta, onChange?: (value: unknown) => void }) => {
    return <>
      <Setting name={props.meta.title} description={props.meta.description}>
        <DropDown selected={getDefaultValue(props.meta)} options={props.meta.options} onChange={(v) => props.onChange(v)} />
      </Setting>
    </>;
  },
  fileSelectDialog: (props: { meta: FileSelectDialogMeta, onChange?: (value: unknown) => void }) => {
    const [filePath, setFilePath] = createSignal<string>(getDefaultValue(props.meta));

    const chooseFile = async () => {
      const retval = await remote.dialog.showOpenDialog({
        properties: ['openFile'],
        filters: props.meta.filters
      });

      if (!retval.canceled && retval.filePaths.length > 0) {
        setFilePath(retval.filePaths[0]);
        props.onChange && props.onChange(untrack(filePath));
      }
    };

    return <>
      <Setting name={props.meta.title} description={props.meta.description}>
        <Text value={filePath() ?? ''} readOnly={true} />
        <ExtraButton icon='folder' onClick={chooseFile} />
      </Setting>
    </>;
  }
};

const getdefaultEditor = (meta: AnyPropertyGridControl, onChange?: (value: unknown) => void) => {
  switch (meta.type) {
    case 'checkbox': {
      const E = editors[meta.type];
      return <E meta={meta} onChange={onChange} />;
    }
    case 'dropdown': {
      const E = editors[meta.type];
      return <E meta={meta} onChange={onChange} />;
    }
    case 'textInput': {
      const E = editors[meta.type];
      return <E meta={meta} onChange={onChange} />;
    }
    case 'fileSelectDialog': {
      const E = editors[meta.type];
      return <E meta={meta} onChange={onChange} />;
    }
    default:
      return <div>Unsupported {JSON.stringify(meta)} </div>;
  }
};

export interface PropertyGridControlMeta<T = unknown> {
  title: string,
  description?: string,
  default?: T | (() => T)
}

export interface FileSelectDialogMeta extends PropertyGridControlMeta<string> {
  type: 'fileSelectDialog',
  filters?: FileFilter[]
}

export interface DropDownMeta extends PropertyGridControlMeta<string> {
  type: 'dropdown',
  options: {
    name?: string,
    value: string
  }[]
}

export interface CheckboxMeta extends PropertyGridControlMeta<boolean> {
  type: 'checkbox'

}

export interface TextInputMeta extends PropertyGridControlMeta<string> {
  type: 'textInput'
}

export type AnyPropertyGridControl = DropDownMeta | CheckboxMeta | TextInputMeta | FileSelectDialogMeta;


export type PropertyGridMeta = {
  [k: string]: AnyPropertyGridControl
}

export type PropertyGridProps = {
  meta: PropertyGridMeta,
  value?: Record<string, unknown>,
  customEditor?: (meta: AnyPropertyGridControl, onChange?: (value: unknown) => void) => JSX.Element | undefined,
  onChange?: (value: Record<string, unknown>, key: string) => void
}


export default (props: PropertyGridProps) => {

  let obj: Record<string, unknown> = {};
  createEffect(() => obj = props.value ?? createDefaultObject(props.meta));

  const onChange = (key: string, value: unknown) => {
    obj[key] = value;
    props.onChange && props.onChange(obj, key);
  };

  const createEditor = (key: string, meta: AnyPropertyGridControl) => {
    const onValueChange = (value: unknown) => onChange(key, value);
    let editor: JSX.Element | undefined = undefined;
    if (props.customEditor) {
      editor = props.customEditor(meta, onValueChange);
      if (editor) {
        return editor;
      }
    }
    return getdefaultEditor(meta, onValueChange);
  };

  return <>
    <For each={Object.entries(props.meta)}>
      {([key, meta]) => createEditor(key, meta)}
    </For>
  </>;
};

export const createDefaultObject = (meta: PropertyGridMeta): Record<string, unknown> => {
  return Object.fromEntries(Object.entries(meta).map(([k, m]) => [k, getDefaultValue(m)]));
};

const getDefaultValue = <T, M extends PropertyGridControlMeta<T>>(meta: M) => {
  if (meta.default) {
    return meta.default instanceof Function ? meta.default() : meta.default;
  }
};