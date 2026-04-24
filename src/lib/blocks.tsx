// Saved blocks facade + React hooks. A saved block is a reusable email
// section (the full {layout, style, columns} shape), tagged with a `kind`
// and persisted per-workspace via window.stStorage. Mutations dispatch
// st:block-change so hooks re-list and the library UI stays fresh.
//
// Events emitted:
//   - st:block-change {id, kind:'create'|'update'|'rename'|'delete'|'restore'|'purge'|'seed'}
//
// Seeding: on first list() for a workspace, if the index is empty and
// we haven't seeded yet (wsSetting `saved_blocks_seeded`), we migrate the
// legacy SAVED_BLOCKS hardcoded list into real records so the library is
// not empty on first open. The flag prevents re-seeding after the user
// deletes everything.

const SEEDED_FLAG = 'saved_blocks_seeded';

// Built-in category ids — these map 1:1 to the legacy kind enum so
// `sectionForKind` can accept either the old kind name ('header') or the
// new seed id ('bc-headers'). User-created categories fall through to the
// blank default, which is what we want.
const BUILTIN_CATEGORY_IDS = new Set([
  'bc-headers', 'bc-footers', 'bc-ctas', 'bc-testimonials',
  'bc-products', 'bc-social', 'bc-signatures', 'bc-custom',
]);
const LEGACY_KINDS = new Set([
  'header', 'footer', 'cta', 'testimonial',
  'product', 'social', 'signature', 'custom',
]);
const CATEGORY_ID_TO_LEGACY = {
  'bc-headers': 'header',
  'bc-footers': 'footer',
  'bc-ctas': 'cta',
  'bc-testimonials': 'testimonial',
  'bc-products': 'product',
  'bc-social': 'social',
  'bc-signatures': 'signature',
  'bc-custom': 'custom',
};

// Each kind maps to a section preset — concrete, renderable content so
// the user sees realistic previews in the library without having to
// craft every seed by hand. Styles mirror the defaults used by
// DEFAULT_SECTIONS (Beefree-shaped outer/inner walls).
// Shared id factory: stable prefix + random suffix. Kept local so this
// file doesn't reach for window utilities that may not be loaded yet.
function mkSectionId() {
  return `s_${Math.random().toString(36).slice(2, 8)}`;
}
function mkBlockId() {
  return `b_${Math.random().toString(36).slice(2, 8)}`;
}

function sectionForKind(kind) {
  const base = window.defaultSectionStyle || (() => ({}));
  // Accept both the new seed category ids ('bc-headers', …) and the
  // legacy kind strings ('header', …). Everything else falls through to
  // the blank default, which is the right behavior for user-created
  // categories that have no conceptual preset.
  const legacy = CATEGORY_ID_TO_LEGACY[kind] || kind;
  switch (legacy) {
    case 'header':
      return {
        id: mkSectionId(),
        layout: '1col',
        style: base({ bg: '#ffffff', padding: 18 }),
        columns: [{ w: 100, blocks: [{ id: mkBlockId(), type: 'header' }] }],
      };
    case 'footer':
      return {
        id: mkSectionId(),
        layout: '1col',
        style: base({ bg: '#f3f1fa', text: '#6a6a8a', padding: 24, align: 'center' }),
        columns: [{ w: 100, blocks: [{ id: mkBlockId(), type: 'footer' }] }],
      };
    case 'cta':
      return {
        id: mkSectionId(),
        layout: '1col',
        style: base({ bg: '#ffffff', padding: 32, align: 'center' }),
        columns: [{
          w: 100,
          blocks: [{
            id: mkBlockId(),
            type: 'button',
            data: { label: 'Comprar ahora', url: '#' },
          }],
        }],
      };
    case 'testimonial':
      return {
        id: mkSectionId(),
        layout: '1col',
        style: base({ bg: '#ffffff', padding: 24, align: 'center' }),
        columns: [{
          w: 100,
          blocks: [
            { id: mkBlockId(), type: 'heading', data: { text: '"Gran servicio, muy recomendado."' } },
            { id: mkBlockId(), type: 'text',    data: { body: '— María G.' } },
          ],
        }],
      };
    case 'product':
      return {
        id: mkSectionId(),
        layout: '2col',
        style: base({ bg: '#ffffff', padding: 28 }),
        columns: [
          { w: 50, blocks: [{ id: mkBlockId(), type: 'product', data: { name: 'Producto 1', price: '$380 MXN' } }] },
          { w: 50, blocks: [{ id: mkBlockId(), type: 'product', data: { name: 'Producto 2', price: '$220 MXN' } }] },
        ],
      };
    case 'social':
      return {
        id: mkSectionId(),
        layout: '1col',
        style: base({ bg: '#ffffff', padding: 18, align: 'center' }),
        columns: [{ w: 100, blocks: [{ id: mkBlockId(), type: 'social' }] }],
      };
    case 'signature':
      return {
        id: mkSectionId(),
        layout: '1col',
        style: base({ bg: '#ffffff', padding: 20 }),
        columns: [{
          w: 100,
          blocks: [
            { id: mkBlockId(), type: 'heading', data: { text: 'Carmen Luna' } },
            { id: mkBlockId(), type: 'text',    data: { body: 'Acme · Fundadora' } },
          ],
        }],
      };
    default:
      return {
        id: mkSectionId(),
        layout: '1col',
        style: base({ bg: '#ffffff', padding: 24 }),
        columns: [{ w: 100, blocks: [] }],
      };
  }
}

// Migrates the legacy hardcoded SAVED_BLOCKS (src/data.tsx) to real
// records. Names match the original prototype so the UI looks the same
// on first open.
const SEED_SAVED_BLOCKS = [
  { name: 'Mi firma con foto',           kind: 'bc-signatures'   },
  { name: 'Footer legal con dirección',  kind: 'bc-footers'      },
  { name: 'Mi header con logo',          kind: 'bc-headers'      },
  { name: 'Botón grande — reservar',     kind: 'bc-ctas'         },
  { name: 'Mis redes sociales',          kind: 'bc-social'       },
  { name: 'Reseña de cliente',           kind: 'bc-testimonials' },
  { name: 'Dos productos destacados',    kind: 'bc-products'     },
  { name: 'Banner de oferta 40%',        kind: 'bc-ctas'         },
  { name: 'Link a agendar (Calendly)',   kind: 'bc-ctas'         },
  { name: 'Aviso legal corto',           kind: 'bc-footers'      },
];

function normalizeDoc(blk) {
  if (!blk) return blk;
  const raw = blk.section;
  const section = raw && typeof raw === 'object'
    ? {
        // Lazy id patch-up for sections saved before `id` was a required
        // field on the section shape. Without an id, the editor's
        // ColumnView couldn't route `sectionId` into click handlers,
        // breaking the image-picker shortcut (and block selection).
        id: raw.id || mkSectionId(),
        layout: raw.layout || '1col',
        style: raw.style || (window.defaultSectionStyle ? window.defaultSectionStyle() : {}),
        columns: Array.isArray(raw.columns)
          ? raw.columns.map((col) => ({
              ...col,
              blocks: (col.blocks || []).map((b) => (b && b.id ? b : { ...b, id: mkBlockId() })),
            }))
          : [],
      }
    : sectionForKind(blk.kind);
  blk.section = section;
  // `kind` is now a category id (string) or null for "uncategorized". Legacy
  // rows written before the category migration carry enum names like
  // 'header' — remap them here so downstream code only sees ids.
  const LEGACY_KIND_MAP = {
    header: 'bc-headers',
    footer: 'bc-footers',
    cta: 'bc-ctas',
    testimonial: 'bc-testimonials',
    product: 'bc-products',
    social: 'bc-social',
    signature: 'bc-signatures',
    custom: 'bc-custom',
  };
  if (typeof blk.kind === 'string' && LEGACY_KIND_MAP[blk.kind]) {
    blk.kind = LEGACY_KIND_MAP[blk.kind];
  }
  return blk;
}

async function listBlocks() {
  if (!window.stStorage.getCurrentWorkspaceId()) return [];
  let rows = await window.stStorage.blocks.list();
  const seeded = window.stStorage.getWSSetting(SEEDED_FLAG, false);
  if (!seeded && Array.isArray(rows) && rows.length === 0) {
    await seedSavedBlocks();
    rows = await window.stStorage.blocks.list();
  }
  // One-shot: rewrite legacy enum kinds ('header', 'footer', …) to seed
  // category ids. Pass `rows` explicitly — if the migrator re-listed via
  // stBlocks.list() it would recurse into this very function. Guarded by
  // a wsSetting flag inside the migrator so subsequent calls are no-ops.
  try {
    const didMigrate = await window.stBlockCategories?.migrateLegacy?.(rows);
    // Only re-list if migration actually rewrote at least one row.
    if (didMigrate) rows = await window.stStorage.blocks.list();
  } catch {}
  return rows;
}

async function listTrashedBlocks() {
  if (!window.stStorage.getCurrentWorkspaceId()) return [];
  return window.stStorage.blocks.listTrashed();
}

async function readBlock(id) {
  const blk = await window.stStorage.blocks.read(id);
  return normalizeDoc(blk);
}

async function writeBlock(id, doc) {
  const result = await window.stStorage.blocks.write(id, doc);
  if (result) {
    window.dispatchEvent(new CustomEvent('st:block-change', {
      detail: { id, kind: 'update' },
    }));
  }
  return result;
}

async function createBlock(seed = {}) {
  const id = await window.stStorage.blocks.newId();
  if (!id) return null;
  // `kind` is now a free-form category id (built-in seed or user-created).
  // Validate against the current category list so a stale filter id from
  // a deleted category doesn't leak into a new row.
  let kind = seed.kind || 'bc-custom';
  if (typeof kind !== 'string' || !kind.trim()) kind = 'bc-custom';
  try {
    const cats = window.stBlockCategories?.list?.() || [];
    if (cats.length && !cats.find((c) => c.id === kind)) {
      kind = cats.find((c) => c.id === 'bc-custom') ? 'bc-custom' : cats[0].id;
    }
  } catch {}
  const doc = {
    id,
    schemaVersion: 1,
    name: seed.name || 'Bloque sin título',
    kind,
    starred: !!seed.starred,
    section: seed.section || sectionForKind(kind),
  };
  normalizeDoc(doc);
  const result = await window.stStorage.blocks.write(id, doc);
  if (!result) return null;
  window.dispatchEvent(new CustomEvent('st:block-change', {
    detail: { id, kind: 'create' },
  }));
  return doc;
}

async function duplicateBlock(id) {
  const src = await readBlock(id);
  if (!src) return null;
  const newId = await window.stStorage.blocks.newId();
  const suffix = window.stI18n?.t?.('editor.section.copySuffix') || '(copy)';
  const copy = { ...src, id: newId, name: `${src.name} ${suffix}`, starred: false };
  const result = await window.stStorage.blocks.write(newId, copy);
  if (!result) return null;
  window.dispatchEvent(new CustomEvent('st:block-change', {
    detail: { id: newId, kind: 'create' },
  }));
  return copy;
}

async function renameBlock(id, name) {
  const doc = await readBlock(id);
  if (!doc) return null;
  doc.name = name;
  await window.stStorage.blocks.write(id, doc);
  window.dispatchEvent(new CustomEvent('st:block-change', {
    detail: { id, kind: 'rename' },
  }));
  return doc;
}

async function deleteBlock(id) {
  await window.stStorage.blocks.remove(id);
  window.dispatchEvent(new CustomEvent('st:block-change', {
    detail: { id, kind: 'delete' },
  }));
}

async function restoreBlock(id) {
  await window.stStorage.blocks.restore(id);
  window.dispatchEvent(new CustomEvent('st:block-change', {
    detail: { id, kind: 'restore' },
  }));
}

async function purgeBlock(id) {
  await window.stStorage.blocks.purge(id);
  window.dispatchEvent(new CustomEvent('st:block-change', {
    detail: { id, kind: 'purge' },
  }));
}

async function toggleBlockStar(id) {
  const doc = await readBlock(id);
  if (!doc) return null;
  doc.starred = !doc.starred;
  await window.stStorage.blocks.write(id, doc);
  window.dispatchEvent(new CustomEvent('st:block-change', {
    detail: { id, kind: 'update' },
  }));
  return doc;
}

async function updateBlock(id, patch) {
  const doc = await readBlock(id);
  if (!doc) return null;
  Object.assign(doc, patch);
  await window.stStorage.blocks.write(id, doc);
  window.dispatchEvent(new CustomEvent('st:block-change', {
    detail: { id, kind: 'update' },
  }));
  return doc;
}

async function setBlockKind(id, kind) {
  // Accepts any category id (or null for "uncategorized"). Caller is
  // responsible for passing a valid id — the category picker enforces it.
  const clean = kind == null || kind === '' ? null : String(kind);
  return updateBlock(id, { kind: clean });
}

// Seeds the legacy hardcoded SAVED_BLOCKS into the workspace. Idempotent
// via the `saved_blocks_seeded` wsSetting flag — once set, future empty
// lists don't re-seed (so deleting everything stays deleted).
async function seedSavedBlocks() {
  for (const seed of SEED_SAVED_BLOCKS) {
    const id = await window.stStorage.blocks.newId();
    if (!id) continue;
    const doc = {
      id,
      schemaVersion: 1,
      name: seed.name,
      kind: seed.kind,
      starred: false,
      section: sectionForKind(seed.kind),
    };
    await window.stStorage.blocks.write(id, doc);
  }
  window.stStorage.setWSSetting(SEEDED_FLAG, true);
  window.dispatchEvent(new CustomEvent('st:block-change', {
    detail: { id: null, kind: 'seed' },
  }));
}

function useBlocks() {
  const [rows, setRows] = React.useState([]);
  React.useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const list = await listBlocks();
      if (alive) setRows(list);
    };
    refresh();
    window.addEventListener('st:block-change', refresh);
    window.addEventListener('st:workspace-change', refresh);
    return () => {
      alive = false;
      window.removeEventListener('st:block-change', refresh);
      window.removeEventListener('st:workspace-change', refresh);
    };
  }, []);
  return rows;
}

function useTrashedBlocks() {
  const [rows, setRows] = React.useState([]);
  React.useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const list = await listTrashedBlocks();
      if (alive) setRows(list);
    };
    refresh();
    window.addEventListener('st:block-change', refresh);
    window.addEventListener('st:workspace-change', refresh);
    return () => {
      alive = false;
      window.removeEventListener('st:block-change', refresh);
      window.removeEventListener('st:workspace-change', refresh);
    };
  }, []);
  return rows;
}

const stBlocks = {
  list: listBlocks,
  listTrashed: listTrashedBlocks,
  read: readBlock,
  write: writeBlock,
  newId: () => window.stStorage.blocks.newId(),
  create: createBlock,
  duplicate: duplicateBlock,
  rename: renameBlock,
  remove: deleteBlock,
  restore: restoreBlock,
  purge: purgeBlock,
  toggleStar: toggleBlockStar,
  update: updateBlock,
  setKind: setBlockKind,
  setCategory: setBlockKind,
  seed: seedSavedBlocks,
  BUILTIN_IDS: Array.from(BUILTIN_CATEGORY_IDS),
  sectionForKind,
};

Object.assign(window, { stBlocks, useBlocks, useTrashedBlocks });
