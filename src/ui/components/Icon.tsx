import { setIcon } from 'obsidian';
import type { JSX } from 'solid-js/jsx-runtime';

export default (props: { name: string, title?: string, class?: string, onClick?: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> }) => {
  return <div
    ref={(el) => setIcon(el, props.name)}
    class={props.class}
    classList={{ 'clickable-icon': !!props.onClick }}
    onClick={props.onClick}
    title={props.title}
  />;
};