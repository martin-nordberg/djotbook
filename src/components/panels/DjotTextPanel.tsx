import { Component, createEffect, onCleanup, onMount } from 'solid-js';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import styles from './panels.module.css';

interface Props {
  path: string;
  content: string;
  onChange: (content: string) => void;
  onEditor?: (view: EditorView) => void;
}

const DjotTextPanel: Component<Props> = (props) => {
  let container!: HTMLDivElement;
  let view: EditorView;
  let suppressChange = false;

  onMount(() => {
    view = new EditorView({
      state: EditorState.create({
        doc: props.content,
        extensions: [
          basicSetup,
          markdown(),
          EditorView.theme({ '&': { height: '100%' }, '.cm-scroller': { overflow: 'auto' } }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !suppressChange) {
              props.onChange(update.state.doc.toString());
            }
          }),
        ],
      }),
      parent: container,
    });
    props.onEditor?.(view);
  });

  createEffect(() => {
    const newContent = props.content;
    if (view && view.state.doc.toString() !== newContent) {
      suppressChange = true;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: newContent },
      });
      suppressChange = false;
    }
  });

  onCleanup(() => view?.destroy());

  return <div class={`${styles.panel} ${styles.panelText}`} ref={container} />;
};

export default DjotTextPanel;
