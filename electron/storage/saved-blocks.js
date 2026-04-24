const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { workspaceSavedBlocksDir, ensureDirs } = require('./paths');
const db = require('./db');

const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;
// `kind` is a free-form string — it holds the id of the user's block
// category (see src/lib/block-categories.tsx). The renderer is the source
// of truth for what ids are valid; the storage layer just persists what it
// gets. Empty string means "uncategorized" (column is NOT NULL).
const KIND_MAX = 64;

function filePath(workspaceId, id) {
  if (!ID_RE.test(workspaceId)) {
    const err = new Error(`Invalid workspace id: ${workspaceId}`);
    err.errorKey = 'storage.err.invalidWorkspaceId';
    err.errorParams = { id: workspaceId };
    throw err;
  }
  if (!ID_RE.test(id)) {
    const err = new Error(`Invalid saved block id: ${id}`);
    err.errorKey = 'storage.err.invalidSavedBlockId';
    err.errorParams = { id };
    throw err;
  }
  return path.join(workspaceSavedBlocksDir(workspaceId), `${id}.json`);
}

function normalizeKind(kind) {
  if (typeof kind !== 'string') return '';
  return kind.length > KIND_MAX ? kind.slice(0, KIND_MAX) : kind;
}

function list(workspaceId) {
  return db
    .get()
    .prepare(
      `SELECT id, name, kind, starred, created_at, updated_at
       FROM saved_blocks_index
       WHERE workspace_id = ? AND deleted_at IS NULL
       ORDER BY updated_at DESC`
    )
    .all(workspaceId)
    .map((r) => ({ ...r, starred: !!r.starred }));
}

function listTrashed(workspaceId) {
  return db
    .get()
    .prepare(
      `SELECT id, name, kind, starred, created_at, updated_at, deleted_at
       FROM saved_blocks_index
       WHERE workspace_id = ? AND deleted_at IS NOT NULL
       ORDER BY deleted_at DESC`
    )
    .all(workspaceId)
    .map((r) => ({ ...r, starred: !!r.starred }));
}

function read(workspaceId, id) {
  const p = filePath(workspaceId, id);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function write(workspaceId, id, doc) {
  // Guard: if the workspace was deleted in a race with a debounced write
  // from the editor, skip instead of resurrecting an orphan index row.
  const ws = db.get().prepare('SELECT id FROM workspaces WHERE id = ?').get(workspaceId);
  if (!ws) return null;

  ensureDirs(workspaceId);
  const p = filePath(workspaceId, id);
  const tmp = `${p}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(doc, null, 2), 'utf8');
  fs.renameSync(tmp, p);

  const name = doc && typeof doc.name === 'string' ? doc.name : 'Bloque sin título';
  const kind = normalizeKind(doc?.kind);
  const starred = doc?.starred ? 1 : 0;
  // Writes preserve existing deleted_at — restoring is an explicit op.
  db.get()
    .prepare(
      `INSERT INTO saved_blocks_index (id, workspace_id, name, kind, starred, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         kind = excluded.kind,
         starred = excluded.starred,
         updated_at = excluded.updated_at`
    )
    .run(id, workspaceId, name, kind, starred);
  return { id, workspaceId, name, kind, starred: !!starred };
}

// Soft-delete: keep the JSON file and the index row, just mark deleted_at.
function remove(workspaceId, id) {
  db.get()
    .prepare(
      `UPDATE saved_blocks_index
       SET deleted_at = datetime('now')
       WHERE workspace_id = ? AND id = ?`
    )
    .run(workspaceId, id);
  return true;
}

function restore(workspaceId, id) {
  db.get()
    .prepare(
      `UPDATE saved_blocks_index
       SET deleted_at = NULL
       WHERE workspace_id = ? AND id = ?`
    )
    .run(workspaceId, id);
  return true;
}

// Hard delete: removes the JSON file and the index row unconditionally.
function purge(workspaceId, id) {
  const p = filePath(workspaceId, id);
  if (fs.existsSync(p)) fs.unlinkSync(p);
  db.get()
    .prepare('DELETE FROM saved_blocks_index WHERE id = ? AND workspace_id = ?')
    .run(id, workspaceId);
  return true;
}

function rename(workspaceId, id, name) {
  const doc = read(workspaceId, id);
  if (!doc) return null;
  doc.name = name;
  return write(workspaceId, id, doc);
}

function newId() {
  return `blk_${crypto.randomBytes(8).toString('hex')}`;
}

module.exports = { list, listTrashed, read, write, remove, restore, purge, rename, newId };
