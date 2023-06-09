
import { For, JSX, onMount } from 'solid-js';
import Setting, { Toggle, DropDown, Text } from './Setting';

const getdefaultEditor = (meta: AnyPropertyGridControl, onChange?: (value: unknown) => void) => {
  switch (meta.type) {
    case 'checkbox':
      return <>
        <Setting name={meta.title} description={meta.description}>
          <Toggle checked={getDefaultValue(meta)} onChange={onChange} />
        </Setting>
      </>;
    case 'dropdown':
      return <>
        <Setting name={meta.title} description={meta.description}>
          <DropDown selected={getDefaultValue(meta)} options={meta.options} onChange={(v) => onChange(v)} />
        </Setting>
      </>;
    case 'textInput':
      return <>
        <Setting name={meta.title} description={meta.description}>
          <Text value={getDefaultValue(meta)} onChange={onChange} />
        </Setting>
      </>;
    default:
      return <div>Unsupported {JSON.stringify(meta)} </div>;
  }
};

export interface PropertyGridControlMeta<T = unknown> {
  title: string,
  description?: string,
  default?: T | (() => T)
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

export type AnyPropertyGridControl = DropDownMeta | CheckboxMeta | TextInputMeta;


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

  const obj: Record<string, unknown> = props.value ?? createDefaultObject(props.meta);

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

const getDefaultValue = <T, M extends PropertyGridControlMeta<T>,>(meta: M): T | undefined => {
  if (meta.default) {
    return meta.default instanceof Function ? meta.default() : meta.default;
  }
};