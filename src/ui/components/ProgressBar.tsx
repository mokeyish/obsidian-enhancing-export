import { createRoot, onCleanup } from 'solid-js';
import { insert } from 'solid-js/web';

const ProgressBar = (props: { message: string, ref: HTMLDivElement }) => {
    return <>
        <div ref={props.ref} class="progress-bar">
            <div class="progress-bar-message u-center-text">{props.message}</div>
            <div class="progress-bar-indicator">
                <div class="progress-bar-line"></div>
                <div class="progress-bar-subline" style="display: none;"></div>
                <div class="progress-bar-subline mod-increase"></div>
                <div class="progress-bar-subline mod-decrease"></div>
            </div>
        </div>
    </>
}

const show = (message: string) => createRoot(dispose => {
    let disposed = false;
    const cleanup = () => {
        if (disposed) {
            return;
        }
        disposed = true;
        dispose();
    };
    let el: HTMLDivElement;
    insert(document.body, () => <ProgressBar ref={el} message={message} />);
    onCleanup(() => {
        el instanceof Node && document.body.contains(el) && document.body.removeChild(el);
    });
    return cleanup;
});


export default { show }