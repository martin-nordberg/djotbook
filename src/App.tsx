import { Component, createSignal, For, onCleanup } from 'solid-js';
import styles from './App.module.css';
import DjotTextPanel from './components/panels/DjotTextPanel';
import DjotHtmlPanel from './components/panels/DjotHtmlPanel';

interface DjotFile {
  id: number;
  name: string;
  path: string;
  content: string;
  handle: any;
  dirty: boolean;
}

let nextId = 1;

const App: Component = () => {
  const [files, setFiles] = createSignal<DjotFile[]>([]);
  const [activeId, setActiveId] = createSignal<number | null>(null);

  const activeFile = () => files().find(f => f.id === activeId()) ?? null;

  async function openFile() {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'Djot files', accept: { 'text/plain': ['.djot'] } }],
        multiple: false,
      });
      const permission = await handle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') return;
      const file: File = await handle.getFile();
      const content = await file.text();
      const path = handle.name;

      const existing = files().find(f => f.path === path);
      if (existing) {
        setActiveId(existing.id);
        return;
      }

      const id = nextId++;
      setFiles(prev => [...prev, { id, name: file.name, path, content, handle, dirty: false }]);
      setActiveId(id);
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.error(err);
    }
  }

  async function saveFile(id: number) {
    const file = files().find(f => f.id === id);
    if (!file || !file.dirty) return;
    try {
      const writable = await file.handle.createWritable();
      await writable.write(file.content);
      await writable.close();
      setFiles(prev => prev.map(f => f.id === id ? { ...f, dirty: false } : f));
    } catch (err) {
      console.error(err);
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
        <span class={styles.appName}>DjotBook</span>
        <button class={styles.openButton} title="Open file" onClick={openFile}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Open
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
        />
        <DjotHtmlPanel
          path={activeFile()?.path ?? ''}
          content={activeFile()?.content ?? ''}
        />
      </div>
    </div>
  );
};

export default App;
