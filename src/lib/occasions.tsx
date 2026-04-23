// User-editable occasions (categorías) persisted per-workspace in
// wsSettings.occasions. Templates link to an occasion via `occasionId`
// on their doc; legacy docs carrying only a `folder` string are matched
// to an occasion by name (lazy migration — no disk write until the user
// explicitly moves the template).
//
// Palette inspired by MongoDB Compass connection colors: a small curated
// set, not a free-form picker, so the sidebar stays visually coherent.

// Jewel-tone palette — chosen for a restrained, high-end feel rather than
// vivid primary dots. Each value is slightly darker than a standard 500
// shade so it reads well against both light and dark surfaces without
// dominating the card.
const OCCASION_PALETTE = [
  { id:'jade',     name:'Jade',       value:'#0F766E' },
  { id:'aqua',     name:'Aguamarina', value:'#0E7490' },
  { id:'sapphire', name:'Zafiro',     value:'#1E40AF' },
  { id:'amethyst', name:'Amatista',   value:'#6D28D9' },
  { id:'opal',     name:'Ópalo',      value:'#A21CAF' },
  { id:'ruby',     name:'Rubí',       value:'#9F1239' },
  { id:'amber',    name:'Ámbar',      value:'#B45309' },
  { id:'moss',     name:'Musgo',      value:'#4D7C0F' },
  { id:'graphite', name:'Grafito',    value:'#475569' },
];

// Seed used on first run in a fresh workspace — hydrates the hardcoded
// CATS list from src/data.tsx into real, editable records. Stable ids
// (same as CATS) so we can also map legacy `folder` strings to them.
const SEED_OCCASIONS = [
  { id:'welcome',    name:'Bienvenida',      color:'#0F766E' }, // Jade
  { id:'newsletter', name:'Newsletters',     color:'#1E40AF' }, // Zafiro
  { id:'promo',      name:'Ventas y promos', color:'#9F1239' }, // Rubí
  { id:'thanks',     name:'Agradecimientos', color:'#A21CAF' }, // Ópalo
  { id:'events',     name:'Eventos',         color:'#6D28D9' }, // Amatista
  { id:'announce',   name:'Avisos',          color:'#B45309' }, // Ámbar
  { id:'surveys',    name:'Encuestas',       color:'#4D7C0F' }, // Musgo
];

// Legacy `folder` strings used by existing templates (see src/data.tsx
// TEMPLATES and DEFAULT_DOC seeds). Maps them to seed occasion ids so
// cards rendered before the user touches anything still show a color.
const LEGACY_FOLDER_TO_ID = {
  'Bienvenida':           'welcome',
  'Newsletter':           'newsletter',
  'Newsletters':          'newsletter',
  'Ventas y promos':      'promo',
  'Agradecimientos':      'thanks',
  'Eventos':              'events',
  'Avisos':               'announce',
  'Encuestas':            'surveys',
};

const OCCASIONS_KEY = 'occasions';

function newOccasionId() {
  return 'oc-' + Math.random().toString(36).slice(2, 10);
}

// Colors used by the first version of SEED_OCCASIONS (Tailwind-500s).
// If a seeded occasion in storage still carries one of these, we swap it
// for the new jewel tone on next read — but only for that exact color
// match, so user-picked customizations are preserved.
const LEGACY_SEED_COLORS = {
  welcome:    '#14b8a6',
  newsletter: '#3b82f6',
  promo:      '#ef4444',
  thanks:     '#ec4899',
  events:     '#8b5cf6',
  announce:   '#f97316',
  surveys:    '#f59e0b',
};

function listOccasions() {
  const raw = window.stStorage.getWSSetting(OCCASIONS_KEY, null);
  if (raw == null) {
    const seed = SEED_OCCASIONS.map((s) => ({ ...s }));
    window.stStorage.setWSSetting(OCCASIONS_KEY, seed);
    return seed;
  }
  if (!Array.isArray(raw)) return [];

  let changed = false;
  const next = raw.map((o) => {
    if (LEGACY_SEED_COLORS[o.id] && o.color === LEGACY_SEED_COLORS[o.id]) {
      const seed = SEED_OCCASIONS.find((s) => s.id === o.id);
      if (seed) { changed = true; return { ...o, color: seed.color }; }
    }
    return o;
  });
  if (changed) window.stStorage.setWSSetting(OCCASIONS_KEY, next);
  return next;
}

function addOccasion({ name, color }) {
  const list = listOccasions();
  const occ = {
    id: newOccasionId(),
    name: String(name || '').trim() || 'Sin nombre',
    color: color || OCCASION_PALETTE[0].value,
  };
  window.stStorage.setWSSetting(OCCASIONS_KEY, [...list, occ]);
  window.dispatchEvent(new CustomEvent('st:occasions-change'));
  return occ;
}

function updateOccasion(id, patch) {
  const list = listOccasions();
  const next = list.map((o) => (o.id === id ? { ...o, ...patch } : o));
  window.stStorage.setWSSetting(OCCASIONS_KEY, next);
  window.dispatchEvent(new CustomEvent('st:occasions-change'));
}

// Removes the occasion from the sidebar and unlinks it from any templates
// that referenced it (so the templates stay — just become unassigned).
async function deleteOccasion(id) {
  const list = listOccasions();
  const target = list.find((o) => o.id === id);
  const next = list.filter((o) => o.id !== id);
  window.stStorage.setWSSetting(OCCASIONS_KEY, next);

  const rows = await window.stTemplates.list();
  for (const row of rows) {
    const doc = await window.stTemplates.read(row.id);
    if (!doc) continue;
    const matchesById = doc.occasionId === id;
    const matchesByLegacyName = !doc.occasionId && target && doc.folder === target.name;
    if (matchesById || matchesByLegacyName) {
      await window.stTemplates.update(row.id, { occasionId: null, folder: 'Sin carpeta' });
    }
  }
  window.dispatchEvent(new CustomEvent('st:occasions-change'));
}

// Writes the link both as `occasionId` (new, canonical) and `folder`
// (legacy display string, still shown in the list view's "Ocasión" column).
async function setTemplateOccasion(templateId, occasionId) {
  const list = listOccasions();
  const occ = occasionId ? list.find((o) => o.id === occasionId) : null;
  await window.stTemplates.update(templateId, {
    occasionId: occ ? occ.id : null,
    folder: occ ? occ.name : 'Sin carpeta',
  });
}

// Resolves which occasion a template row belongs to. Prefers the explicit
// `occasionId` field; if absent (legacy doc), falls back to matching the
// `folder` string against occasion names and the LEGACY_FOLDER_TO_ID map.
function resolveOccasionForRow(row, occasions) {
  if (row?.occasionId) {
    return occasions.find((o) => o.id === row.occasionId) || null;
  }
  const folder = row?.folder;
  if (!folder) return null;
  const byName = occasions.find((o) => o.name === folder);
  if (byName) return byName;
  const legacyId = LEGACY_FOLDER_TO_ID[folder];
  return legacyId ? occasions.find((o) => o.id === legacyId) || null : null;
}

function useOccasions() {
  const [list, setList] = React.useState(() => listOccasions());
  React.useEffect(() => {
    const refresh = () => setList(listOccasions());
    window.addEventListener('st:occasions-change', refresh);
    window.addEventListener('st:workspace-change', refresh);
    window.addEventListener('st:settings-change', (e) => {
      if (e.detail?.key === OCCASIONS_KEY) refresh();
    });
    return () => {
      window.removeEventListener('st:occasions-change', refresh);
      window.removeEventListener('st:workspace-change', refresh);
    };
  }, []);
  return list;
}

const stOccasions = {
  list: listOccasions,
  add: addOccasion,
  update: updateOccasion,
  remove: deleteOccasion,
  setTemplateOccasion,
  resolveOccasionForRow,
  PALETTE: OCCASION_PALETTE,
};

Object.assign(window, { stOccasions, useOccasions });
