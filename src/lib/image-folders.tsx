// User-editable folders for the image library, persisted per workspace in
// wsSettings.image-folders. Mirrors the occasions pattern: a flat array of
// {id, name, color} records, with palette shared from occasions so the
// sidebars feel consistent across the app.
//
// Image rows link to a folder via the existing `folder` TEXT column on the
// images table — we just put the folder id there instead of a free-form
// string. Legacy string folders are migrated lazily when the library mounts.

const IMAGE_FOLDERS_KEY = 'image-folders';

function newImageFolderId() {
  return 'ifld-' + Math.random().toString(36).slice(2, 10);
}

function defaultPalette() {
  const p = window.stOccasions?.PALETTE;
  return Array.isArray(p) && p.length ? p : [{ id:'jade', name:'Jade', value:'#0F766E' }];
}

function listImageFolders() {
  const raw = window.stStorage?.getWSSetting?.(IMAGE_FOLDERS_KEY, null);
  if (raw == null || !Array.isArray(raw)) return [];
  return raw;
}

function addImageFolder({ name, color } = {}) {
  const list = listImageFolders();
  const palette = defaultPalette();
  const fallback = window.stI18n && typeof window.stI18n.t === 'function'
    ? window.stI18n.t('imageLib.folder.untitled')
    : 'Untitled';
  const folder = {
    id: newImageFolderId(),
    name: String(name || '').trim() || fallback,
    color: color || palette[0].value,
  };
  window.stStorage.setWSSetting(IMAGE_FOLDERS_KEY, [...list, folder]);
  window.dispatchEvent(new CustomEvent('st:image-folders-change'));
  return folder;
}

function updateImageFolder(id, patch) {
  const list = listImageFolders();
  const next = list.map((f) => (f.id === id ? { ...f, ...patch } : f));
  window.stStorage.setWSSetting(IMAGE_FOLDERS_KEY, next);
  window.dispatchEvent(new CustomEvent('st:image-folders-change'));
}

// Removes the folder and unlinks any image that referenced it (images stay,
// they just become unassigned). Mirrors deleteOccasion's behavior.
async function deleteImageFolder(id) {
  const list = listImageFolders();
  const next = list.filter((f) => f.id !== id);
  window.stStorage.setWSSetting(IMAGE_FOLDERS_KEY, next);

  const images = window.stImages?.listCached?.() || [];
  const affected = images.filter((img) => img.folder === id);
  for (const img of affected) {
    try { await window.stImages.updateFolder(img.id, null); } catch {}
  }
  window.dispatchEvent(new CustomEvent('st:image-folders-change'));
}

// Pick a color from the palette. Used when auto-creating folders from
// legacy string values so they don't all end up with the same color.
function randomPaletteColor(seed) {
  const palette = defaultPalette();
  if (!seed) return palette[Math.floor(Math.random() * palette.length)].value;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length].value;
}

// One-shot migration: if any image has `folder` set to a value that is NOT
// a known folder id and NOT an empty string, treat it as a legacy name and
// either match an existing folder by name or auto-create one. Strings that
// match the old "no folder" defaults ('Sin carpeta', 'No folder', 'None')
// are nulled instead of becoming folders.
const LEGACY_UNASSIGNED = new Set(['Sin carpeta', 'No folder', 'None', 'Sem pasta', 'Aucun dossier', '未分类', 'フォルダなし']);

async function migrateLegacyFolders() {
  const images = window.stImages?.listCached?.() || [];
  if (images.length === 0) return;

  const folders = listImageFolders();
  const idSet = new Set(folders.map((f) => f.id));
  const byName = new Map(folders.map((f) => [f.name, f]));

  const legacy = new Map();
  for (const img of images) {
    const v = img.folder;
    if (!v) continue;
    if (idSet.has(v)) continue;
    legacy.set(v, (legacy.get(v) || 0) + 1);
  }
  if (legacy.size === 0) return;

  for (const [str] of legacy) {
    if (LEGACY_UNASSIGNED.has(str)) {
      const toUpdate = images.filter((img) => img.folder === str);
      for (const img of toUpdate) {
        try { await window.stImages.updateFolder(img.id, null); } catch {}
      }
      continue;
    }
    let target = byName.get(str);
    if (!target) {
      target = addImageFolder({ name: str, color: randomPaletteColor(str) });
      byName.set(str, target);
    }
    const toUpdate = images.filter((img) => img.folder === str);
    for (const img of toUpdate) {
      try { await window.stImages.updateFolder(img.id, target.id); } catch {}
    }
  }
}

function useImageFolders() {
  const [list, setList] = React.useState(() => listImageFolders());
  React.useEffect(() => {
    const refresh = () => setList(listImageFolders());
    window.addEventListener('st:image-folders-change', refresh);
    window.addEventListener('st:workspace-change', refresh);
    return () => {
      window.removeEventListener('st:image-folders-change', refresh);
      window.removeEventListener('st:workspace-change', refresh);
    };
  }, []);
  return list;
}

const stImageFolders = {
  list: listImageFolders,
  add: addImageFolder,
  update: updateImageFolder,
  remove: deleteImageFolder,
  migrateLegacy: migrateLegacyFolders,
};

Object.assign(window, { stImageFolders, useImageFolders });
