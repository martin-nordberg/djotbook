import { EditorView } from 'codemirror';

interface Anchor {
  offset: number;
  top: number;
}

function extractOffset(el: Element): number {
  const attr = el.getAttribute('data-startpos');
  if (!attr) return -1;
  const parts = attr.split(':');
  return parts.length >= 3 ? parseInt(parts[2], 10) : -1;
}

function getSortedAnchors(panelEl: HTMLElement): Anchor[] {
  const panelRect = panelEl.getBoundingClientRect();
  const panelScrollTop = panelEl.scrollTop;

  return Array.from(panelEl.querySelectorAll('[data-startpos]'))
    .map(el => {
      const offset = extractOffset(el);
      const top = (el as HTMLElement).getBoundingClientRect().top
        - panelRect.top
        + panelScrollTop;
      return { offset, top };
    })
    .filter(a => a.offset >= 0)
    .sort((a, b) => a.offset - b.offset);
}

function findAnchorForCmOffset(anchors: Anchor[], cmOffset: number): Anchor | null {
  if (anchors.length === 0) return null;
  let lo = 0, hi = anchors.length - 1, best = anchors[0];
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (anchors[mid].offset <= cmOffset) { best = anchors[mid]; lo = mid + 1; }
    else hi = mid - 1;
  }
  return best;
}

export function createScrollSync(
  getView: () => EditorView | null,
  getPanelEl: () => HTMLElement | null,
): () => void {
  const onCmScroll = () => {
    const view = getView();
    const panelEl = getPanelEl();
    if (!view || !panelEl) return;

    const scrollTop = view.scrollDOM.scrollTop;
    const block = view.lineBlockAtHeight(scrollTop);
    const anchors = getSortedAnchors(panelEl);
    const anchor = findAnchorForCmOffset(anchors, block.from);

    if (anchor) {
      panelEl.scrollTop = anchor.top;
    } else {
      const frac = scrollTop / Math.max(1, view.scrollDOM.scrollHeight - view.scrollDOM.clientHeight);
      panelEl.scrollTop = frac * Math.max(0, panelEl.scrollHeight - panelEl.clientHeight);
    }
  };

  const view = getView();
  view?.scrollDOM.addEventListener('scroll', onCmScroll, { passive: true });

  return () => {
    view?.scrollDOM.removeEventListener('scroll', onCmScroll);
  };
}
