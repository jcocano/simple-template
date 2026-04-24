// User-editable categories for saved blocks, persisted per workspace in
// wsSettings.block-categories. Mirrors image-folders: a flat array of
// {id, name, color, order} records, with palette shared from occasions so
// the sidebars feel consistent across the app.
//
// Saved blocks link to a category via their existing `kind` TEXT column on
// the blocks table — we just put the category id there instead of the
// hardcoded enum ('header', 'footer', …). On first list, eight built-in
// categories are seeded with stable ids ('bc-headers', 'bc-footers', …)
// that match the legacy kind names, and any block still carrying a legacy
// kind is remapped to its corresponding seed id.

const BLOCK_CATEGORIES_KEY = 'block-categories';
const SEEDED_FLAG = 'block_categories_seeded';
// v2 because the first migration shipped with a buggy backend that
// collapsed every `kind` to 'custom' in the SQL index. Workspaces that
// went through v1 need to re-sync their index from the on-disk JSONs, so
// we bump the flag name to force a re-run under the corrected logic.
const MIGRATED_FLAG = 'block_categories_migrated_v2';

// Stable ids for the 8 built-in categories. Kept as `bc-<slug>` so legacy
// blocks whose `kind` was one of the old enum values can be mapped 1:1.
const LEGACY_KIND_TO_ID = {
  header: 'bc-headers',
  footer: 'bc-footers',
  cta: 'bc-ctas',
  testimonial: 'bc-testimonials',
  product: 'bc-products',
  social: 'bc-social',
  signature: 'bc-signatures',
  custom: 'bc-custom',
};

// Built-in seeds. `labelKey` lets the UI resolve the translated name via
// i18n on every render; user-created categories don't have a labelKey, so
// their `name` is shown verbatim.
const SEED_CATEGORIES = [
  { id: 'bc-headers',      labelKey: 'library.cat.headers',      color: '#1E40AF' }, // Zafiro
  { id: 'bc-footers',      labelKey: 'library.cat.footers',      color: '#475569' }, // Grafito
  { id: 'bc-ctas',         labelKey: 'library.cat.ctas',         color: '#9F1239' }, // Rubí
  { id: 'bc-testimonials', labelKey: 'library.cat.testimonials', color: '#A21CAF' }, // Ópalo
  { id: 'bc-products',     labelKey: 'library.cat.products',     color: '#B45309' }, // Ámbar
  { id: 'bc-social',       labelKey: 'library.cat.social',       color: '#0E7490' }, // Aguamarina
  { id: 'bc-signatures',   labelKey: 'library.cat.signatures',   color: '#6D28D9' }, // Amatista
  { id: 'bc-custom',       labelKey: 'library.cat.custom',       color: '#4D7C0F' }, // Musgo
];

function newCategoryId() {
  return 'bc-' + Math.random().toString(36).slice(2, 10);
}

function defaultPalette() {
  const p = window.stOccasions?.PALETTE;
  return Array.isArray(p) && p.length ? p : [{ id: 'jade', name: 'Jade', value: '#0F766E' }];
}

function fallbackUntitled() {
  return window.stI18n && typeof window.stI18n.t === 'function'
    ? window.stI18n.t('library.category.untitled')
    : 'Untitled';
}

// Translate a category's display name. Built-in categories keep their
// `labelKey` so a language switch re-renders with the localized name;
// user-created ones just return `name`.
function categoryDisplayName(cat) {
  if (!cat) return '';
  if (cat.labelKey && window.stI18n && typeof window.stI18n.t === 'function') {
    return window.stI18n.t(cat.labelKey);
  }
  return cat.name || fallbackUntitled();
}

// Ensures the workspace has the 8 seed categories on first open. Once the
// SEEDED_FLAG is set we never re-seed, even if the user deletes all of
// them — matches how saved blocks themselves behave.
function seedBlockCategoriesIfNeeded() {
  if (!window.stStorage?.getCurrentWorkspaceId?.()) return;
  const seeded = window.stStorage.getWSSetting(SEEDED_FLAG, false);
  if (seeded) return;
  const raw = window.stStorage.getWSSetting(BLOCK_CATEGORIES_KEY, null);
  if (raw == null) {
    const seed = SEED_CATEGORIES.map((s, idx) => ({
      id: s.id,
      name: s.labelKey
        ? (window.stI18n?.t?.(s.labelKey) || s.id)
        : s.id,
      labelKey: s.labelKey,
      color: s.color,
      order: idx,
      builtin: true,
    }));
    window.stStorage.setWSSetting(BLOCK_CATEGORIES_KEY, seed);
  }
  window.stStorage.setWSSetting(SEEDED_FLAG, true);
}

function listBlockCategories() {
  if (!window.stStorage?.getCurrentWorkspaceId?.()) return [];
  seedBlockCategoriesIfNeeded();
  const raw = window.stStorage.getWSSetting(BLOCK_CATEGORIES_KEY, null);
  if (!Array.isArray(raw)) return [];
  // Cheap defensive sort — if `order` is missing we fall back to array
  // position so the list still renders deterministically.
  return [...raw].sort((a, b) => {
    const ao = typeof a.order === 'number' ? a.order : 0;
    const bo = typeof b.order === 'number' ? b.order : 0;
    if (ao !== bo) return ao - bo;
    return 0;
  });
}

function writeCategories(next) {
  const normalized = next.map((c, idx) => ({ ...c, order: idx }));
  window.stStorage.setWSSetting(BLOCK_CATEGORIES_KEY, normalized);
  window.dispatchEvent(new CustomEvent('st:block-categories-change'));
  return normalized;
}

function addBlockCategory({ name, color } = {}) {
  const list = listBlockCategories();
  const palette = defaultPalette();
  const trimmed = String(name || '').trim() || fallbackUntitled();
  const cat = {
    id: newCategoryId(),
    name: trimmed,
    color: color || palette[0].value,
    order: list.length,
    builtin: false,
  };
  writeCategories([...list, cat]);
  return cat;
}

// Patch a category. Clearing a built-in's `labelKey` (via patch explicitly
// setting labelKey: null) lets a user "take ownership" of a seeded category
// — from that point the name is frozen to whatever they typed, even after
// a language switch. Renaming a built-in without touching labelKey keeps
// it translatable.
function updateBlockCategory(id, patch) {
  const list = listBlockCategories();
  const next = list.map((c) => {
    if (c.id !== id) return c;
    const merged = { ...c, ...patch };
    if (patch.name != null && patch.name !== '') {
      const translated = c.labelKey && window.stI18n?.t?.(c.labelKey);
      if (translated && patch.name !== translated) merged.labelKey = null;
    }
    return merged;
  });
  writeCategories(next);
}

// Removes the category and reassigns any block that referenced it. Blocks
// become "uncategorized" (kind = null) — mirrors folder deletion behavior.
async function deleteBlockCategory(id) {
  const list = listBlockCategories();
  const next = list.filter((c) => c.id !== id);
  writeCategories(next);

  try {
    const rows = await window.stBlocks?.list?.();
    if (!Array.isArray(rows)) return;
    const affected = rows.filter((r) => r.kind === id);
    for (const row of affected) {
      try { await window.stBlocks.update(row.id, { kind: null }); } catch {}
    }
  } catch {}
}

// Reorder categories by swapping array positions. `order` is rewritten by
// writeCategories so indices stay contiguous after every move.
function reorderBlockCategory(sourceId, targetId, position = 'before') {
  if (sourceId === targetId) return;
  const list = listBlockCategories();
  const srcIdx = list.findIndex((c) => c.id === sourceId);
  const tgtIdx = list.findIndex((c) => c.id === targetId);
  if (srcIdx < 0 || tgtIdx < 0) return;
  const [moved] = list.splice(srcIdx, 1);
  const adjustedTgt = list.findIndex((c) => c.id === targetId);
  const insertAt = position === 'after' ? adjustedTgt + 1 : adjustedTgt;
  list.splice(insertAt, 0, moved);
  writeCategories(list);
}

// One-shot migration: walk every saved block and rewrite legacy `kind`
// values ('header', 'footer', …) to their seed category ids ('bc-headers',
// 'bc-footers', …). Runs once per workspace; guarded by MIGRATED_FLAG.
//
// IMPORTANT: this is called from inside stBlocks.list(). Calling
// stBlocks.list() again here would recurse infinitely (the flag is only
// flipped after the loop). We take `rows` as an arg — caller already has
// the list — and we talk to storage directly to avoid re-entering the
// facade.
async function migrateLegacyKinds(rows) {
  if (!window.stStorage?.getCurrentWorkspaceId?.()) return false;
  const migrated = window.stStorage.getWSSetting(MIGRATED_FLAG, false);
  if (migrated) return false;
  // Flip the flag up front. Even if something below throws, we never want
  // to retry forever — a single best-effort pass is the contract.
  window.stStorage.setWSSetting(MIGRATED_FLAG, true);

  const list = Array.isArray(rows)
    ? rows
    : (await (window.stStorage?.blocks?.list?.() || Promise.resolve([])));
  if (!Array.isArray(list) || list.length === 0) return false;

  let changed = 0;
  for (const row of list) {
    try {
      // Read the on-disk JSON directly. Three fixups can happen per row:
      //   1. JSON has a legacy kind ('header', 'footer', …) → remap to seed id.
      //   2. JSON has a seed/custom id but the SQL index still carries the
      //      legacy kind or a collapsed 'custom' (survivors of the v1 bug) →
      //      re-persist to resync index.
      // Both cases resolve to the same action: writing the doc back through
      // storage, which refreshes the index row.
      const doc = await window.stStorage.blocks.read(row.id);
      if (!doc) continue;
      let desiredKind = doc.kind;
      if (typeof desiredKind === 'string' && LEGACY_KIND_TO_ID[desiredKind]) {
        desiredKind = LEGACY_KIND_TO_ID[desiredKind];
      }
      const needsRewrite = desiredKind !== doc.kind || desiredKind !== row.kind;
      if (!needsRewrite) continue;
      // We bypass stBlocks.update() to avoid firing st:block-change during
      // migration (which would re-enter listBlocks mid-loop).
      doc.kind = desiredKind;
      await window.stStorage.blocks.write(row.id, doc);
      changed++;
    } catch {}
  }
  if (changed > 0) {
    window.dispatchEvent(new CustomEvent('st:block-change', {
      detail: { id: null, kind: 'seed' },
    }));
  }
  return changed > 0;
}

function useBlockCategories() {
  const [list, setList] = React.useState(() => listBlockCategories());
  // Re-render on language change too — built-ins resolve via labelKey.
  window.stI18n?.useLang?.();
  React.useEffect(() => {
    const refresh = () => setList(listBlockCategories());
    window.addEventListener('st:block-categories-change', refresh);
    window.addEventListener('st:workspace-change', refresh);
    return () => {
      window.removeEventListener('st:block-categories-change', refresh);
      window.removeEventListener('st:workspace-change', refresh);
    };
  }, []);
  return list;
}

const stBlockCategories = {
  list: listBlockCategories,
  add: addBlockCategory,
  update: updateBlockCategory,
  remove: deleteBlockCategory,
  reorder: reorderBlockCategory,
  migrateLegacy: migrateLegacyKinds,
  displayName: categoryDisplayName,
  LEGACY_KIND_TO_ID,
};

Object.assign(window, { stBlockCategories, useBlockCategories });
