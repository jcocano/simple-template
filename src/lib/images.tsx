// Facade over window.storage.images for the renderer. Owns an in-memory
// cache per workspace so the library screen and the image picker can read
// synchronously after the first `boot()` or `list()` call.
//
// Emits `st:images-change` whenever the cache changes so subscribers can
// re-render. Workspace switches clear the cache and reload for the new ws.

const state = {
  cache: new Map(),     // workspaceId → Image[]
  current: null,        // current workspace id cached at last load
};

function _emit() {
  window.dispatchEvent(new CustomEvent('st:images-change'));
}

function _wsId() {
  return window.stStorage?.getCurrentWorkspaceId?.() || null;
}

// Synchronous read — only populated after list() has been awaited at least
// once for the current workspace.
function listCached() {
  const wsId = _wsId();
  if (!wsId) return [];
  return state.cache.get(wsId) || [];
}

async function list() {
  const wsId = _wsId();
  if (!wsId || !window.storage?.images) return [];
  const rows = (await window.storage.images.list(wsId)) || [];
  state.cache.set(wsId, rows);
  state.current = wsId;
  _emit();
  return rows;
}

async function save(entry) {
  const wsId = _wsId();
  if (!wsId || !window.storage?.images) return null;
  const saved = await window.storage.images.add(wsId, entry);
  if (saved) {
    const prev = state.cache.get(wsId) || [];
    state.cache.set(wsId, [saved, ...prev]);
    _emit();
  }
  return saved;
}

async function remove(id) {
  const wsId = _wsId();
  if (!wsId || !window.storage?.images) return false;
  const ok = await window.storage.images.remove(wsId, id);
  if (ok) {
    const prev = state.cache.get(wsId) || [];
    state.cache.set(wsId, prev.filter((r) => r.id !== id));
    _emit();
  }
  return ok;
}

async function updateFolder(id, folder) {
  const wsId = _wsId();
  if (!wsId || !window.storage?.images) return null;
  const updated = await window.storage.images.updateFolder(wsId, id, folder);
  if (updated) {
    const prev = state.cache.get(wsId) || [];
    state.cache.set(wsId, prev.map((r) => (r.id === id ? updated : r)));
    _emit();
  }
  return updated;
}

async function rename(id, name) {
  const wsId = _wsId();
  if (!wsId || !window.storage?.images) return null;
  const updated = await window.storage.images.rename(wsId, id, name);
  if (updated) {
    const prev = state.cache.get(wsId) || [];
    state.cache.set(wsId, prev.map((r) => (r.id === id ? updated : r)));
    _emit();
  }
  return updated;
}

// Returns [{ folder, count }] derived from the cache. Does not hit SQLite —
// the server-side helper exists but the renderer already has everything.
function folders() {
  const all = listCached();
  const map = new Map();
  for (const img of all) {
    const f = img.folder || 'Sin carpeta';
    map.set(f, (map.get(f) || 0) + 1);
  }
  return Array.from(map, ([folder, count]) => ({ folder, count }))
    .sort((a, b) => a.folder.localeCompare(b.folder, 'es'));
}

// Load real image dimensions from a browser File/Blob. Used when saving an
// upload so the library shows accurate w×h immediately. Falls back to
// {width:null, height:null} on any failure (SVG without intrinsic size, etc).
function readImageSize(file) {
  return new Promise((resolve) => {
    if (!file || !(file instanceof Blob)) return resolve({ width: null, height: null });
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth || null, height: img.naturalHeight || null });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: null, height: null });
    };
    img.src = url;
  });
}

// Refresh when the workspace changes: the cache is per-workspace so we flush
// the old one and re-list for the new one. Subscribers hear two events (the
// clear and the refill) — harmless for grids.
if (typeof window !== 'undefined') {
  window.addEventListener('st:workspace-change', () => {
    const wsId = _wsId();
    if (!wsId) return;
    state.current = wsId;
    _emit();
    list().catch(() => {});
  });
}

const stImages = { list, listCached, save, remove, updateFolder, rename, folders, readImageSize };
Object.assign(window, { stImages });
