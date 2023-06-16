import { For, JSX, createContext, onCleanup, onMount, useContext } from 'solid-js';
import * as Ob from 'obsidian';

type SettingContext = {
  settingEl: HTMLDivElement
}

const Context = createContext<SettingContext>();

const useSetting = () => useContext(Context);

export default (props: {
  name?: string,
  description?: string,
  class?: string,
  heading?: boolean,
  disabled?: boolean,
  noInfo?: boolean,
  children?: JSX.Element
}) => {
  const context: SettingContext = {
    settingEl: null
  };
  return <>
    <Context.Provider value={context}>
      <div
        ref={(el) => context.settingEl = el}
        class={`setting-item ${props.class ?? ''}`.trimEnd()}
        classList={{
          'setting-item-heading': props.heading,
          'is-disable': props.disabled
        }}>
        <div class="setting-item-info">
          <div class="setting-item-name">{props.name}</div>
          <div class="setting-item-description">{props.description}</div>
        </div>
        <div class="setting-item-control">
          {props.children}
        </div>
      </div>
    </Context.Provider>
  </>;
};


export const Toggle = (props: { checked?: boolean, onChange?: (checked: boolean) => void }) => {
  const setting = useSetting();
  onMount(() => {
    setting.settingEl.addClass('mod-toggle');
  });
  onCleanup(() => {
    setting.settingEl.removeClass('mod-toggle');
  });
  return <>
    <div class="checkbox-container" classList={{ 'is-enabled': props.checked }} onClick={() => props.onChange && props.onChange(!props.checked)} >
      <input type="checkbox" />
    </div>
  </>;
};


export const ExtraButton = (props: { icon?: string, onClick?: () => void, tooltip?: string }) => {
  return <div
    ref={(el) => props.icon && Ob.setIcon(el, props.icon)}
    class="setting-editor-extra-setting-button"
    classList={{ 'clickable-icon': props.icon && !!props.onClick }}
    aria-label={props.tooltip}
    onClick={props.onClick}
  />;
};


export const Text = (props: { placeholder?: string, 
  title?: string, 
  value?: string,
  style?: string,
  disabled?: boolean, 
  readOnly?: boolean,
  spellcheck?: boolean,
  onChange?: (value: string) => void }) => {
  return <input
    type="text"
    title={props.title} 
    readOnly={props.readOnly}
    placeholder={props.placeholder}
    spellcheck={props.spellcheck ?? false}
    style={props.style}
    value={props.value}
    onChange={(e) => props.onChange && props.onChange(e.target.value)}
    disabled={props.disabled}
  />;
};

export const TextArea = (props: { placeholder?: string, 
  title?: string, 
  value?: string,
  style?: string,
  disabled?: boolean, 
  spellcheck?: boolean, 
  onChange?: (value: string) => void }) => {
  return <textarea
    placeholder={props.placeholder}
    spellcheck={props.spellcheck ?? false}
    style={props.style}
    value={props.value}
    onChange={(e) => props.onChange && props.onChange(e.target.value)}
    disabled={props.disabled}
  />;
};


export const DropDown = (props: {
  options: { name?: string, value: string }[],
  selected?: string,
  onChange?: (value: string, index: number) => void
}) => {
  return <>
    <select class="dropdown" onChange={(e) => props.onChange && props.onChange(e.target.value, e.target.selectedIndex)} autofocus={true}>
      <For each={props.options}>
        {(item) => <option value={item.value} selected={item.value === props.selected}>{item.name ?? item.value}</option>}
      </For>
    </select>
  </>;
};