import { Component, createMemo } from 'solid-js';
import { parse, renderHTML } from '@djot/djot';
import styles from './panels.module.css';

interface Props {
  path: string;
  content: string;
}

const DjotHtmlPanel: Component<Props> = (props) => {
  const html = createMemo(() => renderHTML(parse(props.content)));

  return (
    <div class={styles.panel} innerHTML={html()} />
  );
};

export default DjotHtmlPanel;
