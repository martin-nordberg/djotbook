import { Component, createEffect, onCleanup, onMount } from 'solid-js';
import { EditorView, basicSetup } from 'codemirror';
import { keymap } from '@codemirror/view';
import { EditorState, Prec } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import styles from './panels.module.css';

function toggleWrap(view: EditorView, marker: string, markerOpen: string, markerClose: string): boolean {
  const sel = view.state.selection.main;
  if (sel.empty) return false;
  const text = view.state.sliceDoc(sel.from, sel.to);

  if (text.startsWith(markerOpen) && text.endsWith(markerClose)) {
    const inner = text.slice(markerOpen.length, text.length - markerClose.length);
    view.dispatch({
      changes: { from: sel.from, to: sel.to, insert: inner },
      selection: { anchor: sel.from, head: sel.from + inner.length },
    });
    return true;
  }

  if (text.startsWith(marker) && text.endsWith(marker) && text.length > marker.length * 2) {
    const inner = text.slice(marker.length, text.length - marker.length);
    view.dispatch({
      changes: { from: sel.from, to: sel.to, insert: inner },
      selection: { anchor: sel.from, head: sel.from + inner.length },
    });
    return true;
  }

  const hasEdgeWhitespace = /^\s|\s$/.test(text);
  const open = hasEdgeWhitespace ? markerOpen : marker;
  const close = hasEdgeWhitespace ? markerClose : marker;
  view.dispatch({
    changes: [
      { from: sel.from, insert: open },
      { from: sel.to, insert: close },
    ],
    selection: { anchor: sel.from, head: sel.to + open.length + close.length },
  });
  return true;
}

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
          Prec.highest(keymap.of([
            {
              key: 'Mod-b',
              run: (view) => toggleWrap(view, '*', '{*', '*}'),
              preventDefault: true,
            },
            {
              key: 'Mod-i',
              run: (view) => toggleWrap(view, '_', '{_', '_}'),
              preventDefault: true,
            },
          ])),
          markdown(),
          EditorView.lineWrapping,
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
