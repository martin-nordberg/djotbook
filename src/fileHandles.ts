const DB_NAME = 'djotbook';
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles');
      if (!db.objectStoreNames.contains('recent')) db.createObjectStore('recent');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function put(store: string, key: string, value: any): Promise<void> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

function get<T>(store: string, key: string): Promise<T | null> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  }));
}

export async function saveHandle(name: string, handle: any): Promise<void> {
  try { await put('handles', name, handle); } catch {}
}

export async function loadHandle(name: string): Promise<any | null> {
  try { return await get('handles', name); } catch { return null; }
}

export async function saveRecent(list: string[]): Promise<void> {
  try { await put('recent', 'list', list); } catch {}
}

export async function loadRecent(): Promise<string[]> {
  try { return (await get<string[]>('recent', 'list')) ?? []; } catch { return []; }
}
