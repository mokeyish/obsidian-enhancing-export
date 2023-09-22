import { App, Modal } from 'obsidian';
import { JSX, createEffect, onCleanup, onMount } from 'solid-js';
import { insert } from 'solid-js/web';

export default (props: {
  app: App,
  title?: JSX.Element,
  children: JSX.Element,
  classList?: {
    [k: string]: boolean;
  },
  hidden?: boolean,
  onClose?: () => void
}) => {
  const modal = new Modal(props.app);
  let classes: string[] = [];
  let clean = false;
  createEffect(() => {
    insert(modal.titleEl, () => props.title);
  });
  createEffect(() => {
    insert(modal.contentEl, () => props.children);
  });
  createEffect(() => {
    const newClasses = Object.entries(props.classList ?? {}).filter(([, v]) => v).map(([k,]) => k);
    if (classes.length > 0) {
      modal.containerEl.removeClasses(classes);
    }
    if (newClasses.length > 0) {
      modal.containerEl.addClasses(newClasses);
    }
    classes = newClasses;
  });
  createEffect(() => {
    modal.containerEl.style.display = props.hidden ? 'None' : '';
  });

  modal.onClose = () => {
    if (clean) return;
    clean = true;
    props.onClose();
  };

  onMount(() => modal.open());

  onCleanup(() => {
    if (!clean) {
      modal.close();
    }
  });

  return document.createTextNode('');
};
