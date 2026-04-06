import { Component, createSignal, For, onCleanup } from 'solid-js';
import { EditorView } from 'codemirror';
import styles from './App.module.css';
import DjotTextPanel from './components/panels/DjotTextPanel';
import DjotHtmlPanel from './components/panels/DjotHtmlPanel';
import { createScrollSync } from './components/panels/useScrollSync';

interface DjotFile {
  id: number;
  name: string;
  path: string;
  content: string;
  handle: any;
  dirty: boolean;
  everSaved: boolean;
}

let nextId = 1;

const App: Component = () => {
  const [files, setFiles] = createSignal<DjotFile[]>([]);
  const [activeId, setActiveId] = createSignal<number | null>(null);
  const [saving, setSaving] = createSignal(false);

  let editorView: EditorView | null = null;
  let htmlPanelEl: HTMLDivElement | null = null;
  let scrollSyncCleanup: (() => void) | null = null;

  function initScrollSync() {
    scrollSyncCleanup?.();
    scrollSyncCleanup = null;
    if (editorView && htmlPanelEl) {
      scrollSyncCleanup = createScrollSync(() => editorView, () => htmlPanelEl);
    }
  }

  onCleanup(() => scrollSyncCleanup?.());

  const activeFile = () => files().find(f => f.id === activeId()) ?? null;

  const saveLabel = () => {
    if (saving()) return 'Saving Changes \u2026';
    const f = activeFile();
    if (!f || !f.dirty && !f.everSaved) return 'No Changes to Save';
    if (f.dirty && !f.everSaved) return 'Save Changes Automatically';
    if (!f.dirty && f.everSaved) return 'All Changes Saved';
    return 'Unsaved Changes Pending';
  };

  async function openFile() {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'Djot files', accept: { 'text/plain': ['.djot'] } }],
        multiple: false,
      });
      const file: File = await handle.getFile();
      const content = await file.text();
      const path = handle.name;

      const existing = files().find(f => f.path === path);
      if (existing) {
        setActiveId(existing.id);
        return;
      }

      const id = nextId++;
      setFiles(prev => [...prev, { id, name: file.name, path, content, handle, dirty: false, everSaved: false }]);
      setActiveId(id);
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.error(err);
    }
  }

  async function saveFile(id: number) {
    const file = files().find(f => f.id === id);
    if (!file || !file.dirty) return;
    setSaving(true);
    try {
      const writable = await file.handle.createWritable();
      await writable.write(file.content);
      await writable.close();
      setFiles(prev => prev.map(f => f.id === id ? { ...f, dirty: false, everSaved: true } : f));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const autoSaveInterval = setInterval(() => {
    files().filter(f => f.dirty).forEach(f => saveFile(f.id));
  }, 60_000);

  onCleanup(() => clearInterval(autoSaveInterval));

  function updateContent(content: string) {
    const id = activeId();
    if (id == null) return;
    setFiles(prev => prev.map(f => f.id === id ? { ...f, content, dirty: true } : f));
  }

  async function closeFile(id: number) {
    await saveFile(id);
    const list = files();
    const idx = list.findIndex(f => f.id === id);
    const next = list.length > 1
      ? (list[idx + 1] ?? list[idx - 1])
      : null;
    setFiles(prev => prev.filter(f => f.id !== id));
    setActiveId(next?.id ?? null);
  }

  return (
    <div class={styles.app}>
      <nav class={styles.navbar}>
        <a href="https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html" target="_blank" rel="noreferrer" class={styles.logoLink}>
          <img src="/src/assets/favicon.svg" alt="Djot syntax reference" width="24" height="24" />
        </a>
        <span class={styles.appName}>DjotBook</span>
        <button class={styles.openButton} title="Open file" onClick={openFile}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Open
        </button>
        <button
          class={styles.saveButton}
          onClick={() => { const id = activeId(); if (id != null) saveFile(id); }}
          disabled={saving() || !activeFile()?.dirty}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          {saveLabel()}
        </button>
      </nav>

      <div class={styles.tabBar}>
        <For each={files()}>
          {(file) => (
            <div
              class={styles.tab}
              classList={{ [styles.tabActive]: file.id === activeId() }}
              onClick={() => setActiveId(file.id)}
            >
              <span class={styles.tabTitle}>{file.name}{file.dirty ? ' *' : ''}</span>
              <button
                class={styles.tabClose}
                title="Close"
                onClick={(e) => { e.stopPropagation(); closeFile(file.id); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}
        </For>
      </div>

      <div class={styles.panels}>
        <DjotTextPanel
          path={activeFile()?.path ?? ''}
          content={activeFile()?.content ?? ''}
          onChange={updateContent}
          onEditor={(view) => { editorView = view; initScrollSync(); }}
        />
        <DjotHtmlPanel
          path={activeFile()?.path ?? ''}
          content={activeFile()?.content ?? ''}
          onPanelRef={(el) => { htmlPanelEl = el; initScrollSync(); }}
        />
      </div>
    </div>
  );
};

export default App;
