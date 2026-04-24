// Templates facade + React hooks. Always scoped to the current workspace
// (via window.stStorage). Mutations dispatch st:template-change so
// useTemplates() re-lists, and editors observing their own id refresh.
//
// Events emitted:
//   - st:template-change {id, kind:'create'|'update'|'rename'|'delete'}

async function listTemplates() {
  if (!window.stStorage.getCurrentWorkspaceId()) return [];
  return window.stStorage.templates.list();
}

async function listTrashedTemplates() {
  if (!window.stStorage.getCurrentWorkspaceId()) return [];
  return window.stStorage.templates.listTrashed();
}

// Normalizes the doc shape so callers can rely on `doc.sections` always being
// present. Older templates on disk may have `doc` as a bare sections array, or
// as `{sections, page}` from a previous (now reverted) experiment — fold both
// to the canonical `{sections}` shape. Section-level fields (outerBg, width…)
// are merged in by the renderers via `defaultSectionStyle`.
function normalizeDoc(tpl) {
  if (!tpl) return tpl;
  const raw = tpl.doc;
  const sections = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.sections) ? raw.sections : [];
  tpl.doc = { sections };
  return tpl;
}

async function readTemplate(id) {
  const tpl = await window.stStorage.templates.read(id);
  return normalizeDoc(tpl);
}

async function writeTemplate(id, doc) {
  const result = await window.stStorage.templates.write(id, doc);
  if (result) {
    window.dispatchEvent(new CustomEvent('st:template-change', {
      detail: { id, kind: 'update' }
    }));
  }
  return result;
}

async function createTemplate(seed = {}) {
  const id = await window.stStorage.templates.newId();
  if (!id) return null;
  // Each new template gets its own copy of the workspace's default variables
  // (or the global VARIABLES const as final fallback). After creation, this
  // list is template-owned — editing it from the Etiquetas modal in the
  // editor only affects this template.
  const wsDefaults = window.stStorage.getWSSetting('vars', null);
  const sourceVars = seed.vars || wsDefaults || window.VARIABLES || [];
  const vars = sourceVars.map((v) => ({ ...v }));
  const doc = {
    id,
    schemaVersion: 1,
    name: seed.name || 'Plantilla sin título',
    folder: seed.folder || 'Sin carpeta',
    status: seed.status || 'draft',
    starred: !!seed.starred,
    variant: seed.variant || 'newsletter',
    color: seed.color || '#e8e7fe',
    doc: seed.doc || { sections: [] },
    vars,
    meta: seed.meta || { subject: '', preview: '', fromName: '', fromEmail: '' },
  };
  normalizeDoc(doc);
  const result = await window.stStorage.templates.write(id, doc);
  if (!result) return null;
  window.dispatchEvent(new CustomEvent('st:template-change', {
    detail: { id, kind: 'create' }
  }));
  return doc;
}

async function duplicateTemplate(id) {
  const src = await readTemplate(id);
  if (!src) return null;
  const newId = await window.stStorage.templates.newId();
  const suffix = window.stI18n?.t?.('editor.section.copySuffix') || '(copy)';
  const copy = { ...src, id: newId, name: `${src.name} ${suffix}`, starred: false };
  const result = await window.stStorage.templates.write(newId, copy);
  if (!result) return null;
  window.dispatchEvent(new CustomEvent('st:template-change', {
    detail: { id: newId, kind: 'create' }
  }));
  return copy;
}

async function renameTemplate(id, name) {
  const doc = await readTemplate(id);
  if (!doc) return null;
  doc.name = name;
  await window.stStorage.templates.write(id, doc);
  window.dispatchEvent(new CustomEvent('st:template-change', {
    detail: { id, kind: 'rename' }
  }));
  return doc;
}

// Soft-delete: moves to trash. Use purgeTemplate for hard delete.
async function deleteTemplate(id) {
  await window.stStorage.templates.remove(id);
  window.dispatchEvent(new CustomEvent('st:template-change', {
    detail: { id, kind: 'delete' }
  }));
}

async function restoreTemplate(id) {
  await window.stStorage.templates.restore(id);
  window.dispatchEvent(new CustomEvent('st:template-change', {
    detail: { id, kind: 'restore' }
  }));
}

async function purgeTemplate(id) {
  await window.stStorage.templates.purge(id);
  window.dispatchEvent(new CustomEvent('st:template-change', {
    detail: { id, kind: 'purge' }
  }));
}

async function toggleStar(id) {
  const doc = await readTemplate(id);
  if (!doc) return null;
  doc.starred = !doc.starred;
  await window.stStorage.templates.write(id, doc);
  window.dispatchEvent(new CustomEvent('st:template-change', {
    detail: { id, kind: 'update' }
  }));
  return doc;
}

async function updateTemplate(id, patch) {
  const doc = await readTemplate(id);
  if (!doc) return null;
  Object.assign(doc, patch);
  await window.stStorage.templates.write(id, doc);
  window.dispatchEvent(new CustomEvent('st:template-change', {
    detail: { id, kind: 'update' }
  }));
  return doc;
}

// Returns rows merged from the SQLite index (name, updated_at) with
// the richer JSON attributes (variant, color, folder, starred, status)
// the dashboard needs. Re-reads all rows on any change event — fine at
// prototype scale (8–16 templates, local FS).
async function enrichRows(rows) {
  return Promise.all(rows.map(async (row) => {
    const doc = await window.stStorage.templates.read(row.id);
    return {
      id: row.id,
      name: row.name,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at || null,
      folder: doc?.folder,
      occasionId: doc?.occasionId || null,
      status: doc?.status,
      starred: !!doc?.starred,
      variant: doc?.variant,
      color: doc?.color,
      sharedFrom: doc?.sharedFrom || null,
      sharedAt: doc?.sharedAt || null,
    };
  }));
}

function useTemplates() {
  const [rows, setRows] = React.useState([]);
  React.useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const list = await listTemplates();
      if (!alive) return;
      const enriched = await enrichRows(list);
      if (alive) setRows(enriched);
    };
    refresh();
    window.addEventListener('st:template-change', refresh);
    window.addEventListener('st:workspace-change', refresh);
    return () => {
      alive = false;
      window.removeEventListener('st:template-change', refresh);
      window.removeEventListener('st:workspace-change', refresh);
    };
  }, []);
  return rows;
}

function useTrashedTemplates() {
  const [rows, setRows] = React.useState([]);
  React.useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const list = await listTrashedTemplates();
      if (!alive) return;
      const enriched = await enrichRows(list);
      if (alive) setRows(enriched);
    };
    refresh();
    window.addEventListener('st:template-change', refresh);
    window.addEventListener('st:workspace-change', refresh);
    return () => {
      alive = false;
      window.removeEventListener('st:template-change', refresh);
      window.removeEventListener('st:workspace-change', refresh);
    };
  }, []);
  return rows;
}

const stTemplates = {
  list: listTemplates,
  listTrashed: listTrashedTemplates,
  read: readTemplate,
  write: writeTemplate,
  newId: () => window.stStorage.templates.newId(),
  create: createTemplate,
  duplicate: duplicateTemplate,
  rename: renameTemplate,
  remove: deleteTemplate,
  restore: restoreTemplate,
  purge: purgeTemplate,
  toggleStar,
  update: updateTemplate,
};

Object.assign(window, { stTemplates, useTemplates, useTrashedTemplates });
