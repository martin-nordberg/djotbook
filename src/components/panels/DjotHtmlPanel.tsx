import { Component, createMemo } from 'solid-js';
import { parse, renderHTML } from '@djot/djot';
import styles from './panels.module.css';
import 'github-markdown-css/github-markdown.css';

interface Props {
  path: string;
  content: string;
  onPanelRef?: (el: HTMLDivElement) => void;
}

const DjotHtmlPanel: Component<Props> = (props) => {
  const html = createMemo(() => renderHTML(parse(props.content, { sourcePositions: true })));

  function handleClick(e: MouseEvent) {
    const anchor = (e.target as Element).closest('a');
    if (anchor?.href) {
      e.preventDefault();
      window.open(anchor.href, '_blank', 'noreferrer');
    }
  }

  return (
    <div class={`${styles.panel} ${styles.panelPreview} markdown-body`} ref={props.onPanelRef} innerHTML={html()} onClick={handleClick} />
  );
};

export default DjotHtmlPanel;
