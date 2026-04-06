import { Component, createMemo } from 'solid-js';
import { parse, renderHTML } from '@djot/djot';
import styles from './panels.module.css';

interface Props {
  path: string;
  content: string;
  onPanelRef?: (el: HTMLDivElement) => void;
}

const DjotHtmlPanel: Component<Props> = (props) => {
  const html = createMemo(() => renderHTML(parse(props.content, { sourcePositions: true })));

  return (
    <div class={styles.panel} ref={props.onPanelRef} innerHTML={html()} />
  );
};

export default DjotHtmlPanel;
