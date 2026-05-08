const LS = {
  books:  'kh-books-v1',
  chat:   'kh-chat-v1',
  prefs:  'kh-prefs-v1',
  apiKey: 'kh-gemini-key',
};

export const getApiKey = ()  => localStorage.getItem(LS.apiKey) || '';
export const setApiKey = (k) => localStorage.setItem(LS.apiKey, k.trim());

const STATUS_MAP = { read: 'done', reading: 'in_progress' };

function migrateItem(item) {
  return {
    ...item,
    creator: item.creator || item.author || '',
    status: STATUS_MAP[item.status] || item.status,
  };
}

export const emptyData = () => ({
  items:       [],
  chatHistory: [],
  rallyCount:  0,
  prefs:       { includeProfileInChat: true },
});

export function loadData() {
  const d = emptyData();
  try {
    const v = localStorage.getItem(LS.books);
    if (v) d.items = JSON.parse(v).map(migrateItem);
  } catch {}
  try {
    const v = localStorage.getItem(LS.chat);
    if (v) { const c = JSON.parse(v); d.chatHistory = c.h || []; d.rallyCount = c.r || 0; }
  } catch {}
  try { const v = localStorage.getItem(LS.prefs); if (v) d.prefs = { ...d.prefs, ...JSON.parse(v) }; } catch {}
  return d;
}

export function saveData(d) {
  try { localStorage.setItem(LS.books, JSON.stringify(d.items)); } catch {}
  try { localStorage.setItem(LS.chat, JSON.stringify({ h: d.chatHistory, r: d.rallyCount })); } catch {}
  try { localStorage.setItem(LS.prefs, JSON.stringify(d.prefs)); } catch {}
}

export function clearAllData() {
  Object.values(LS).forEach(k => { try { localStorage.removeItem(k); } catch {} });
}

/* IndexedDB for cover images */
const IDB = { name: 'kh-images', ver: 1, store: 'images' };

function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB.name, IDB.ver);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB.store))
        db.createObjectStore(IDB.store, { keyPath: 'id' });
    };
    req.onsuccess = (e) => res(e.target.result);
    req.onerror   = (e) => rej(e.target.error);
  });
}

export async function saveImage(id, dataUrl) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB.store, 'readwrite');
    tx.objectStore(IDB.store).put({ id, dataUrl });
    tx.oncomplete = () => res();
    tx.onerror    = (e) => rej(e.target.error);
  });
}

export async function getImage(id) {
  if (!id) return null;
  try {
    const db = await openDB();
    return new Promise((res, rej) => {
      const req = db.transaction(IDB.store, 'readonly').objectStore(IDB.store).get(id);
      req.onsuccess = (e) => res(e.target.result?.dataUrl || null);
      req.onerror   = (e) => rej(e.target.error);
    });
  } catch { return null; }
}

export async function deleteImage(id) {
  if (!id) return;
  try {
    const db = await openDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(IDB.store, 'readwrite');
      tx.objectStore(IDB.store).delete(id);
      tx.oncomplete = () => res();
      tx.onerror    = (e) => rej(e.target.error);
    });
  } catch {}
}

function getAllImages() {
  return new Promise(async (res) => {
    try {
      const db = await openDB();
      const tx = db.transaction(IDB.store, 'readonly');
      const req = tx.objectStore(IDB.store).getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => res([]);
    } catch { res([]); }
  });
}

export async function exportAllData() {
  const data = loadData();
  const images = await getAllImages();
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data, images }, null, 2);
}

export async function importAllData(json) {
  const parsed = JSON.parse(json);
  if (!parsed.data) throw new Error('無効なファイル形式です');
  if (parsed.data.books && !parsed.data.items) {
    parsed.data.items = parsed.data.books.map(migrateItem);
    delete parsed.data.books;
  }
  saveData(parsed.data);
  if (parsed.images?.length > 0) {
    const db = await openDB();
    for (const img of parsed.images) {
      await new Promise((res, rej) => {
        const tx = db.transaction(IDB.store, 'readwrite');
        tx.objectStore(IDB.store).put(img);
        tx.oncomplete = () => res();
        tx.onerror = (e) => rej(e.target.error);
      });
    }
  }
  return parsed.data;
}

export function resizeImage(file, maxW = 1200, maxH = 1200, q = 0.85) {
  return new Promise((res) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      res(canvas.toDataURL('image/jpeg', q));
    };
    img.onerror = () => { URL.revokeObjectURL(url); res(null); };
    img.src = url;
  });
}
