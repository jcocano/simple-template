const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { workspaceTemplatesDir, ensureDirs } = require('./paths');
const db = require('./db');

const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

function filePath(workspaceId, id) {
  if (!ID_RE.test(workspaceId)) throw new Error(`invalid workspace id: ${workspaceId}`);
  if (!ID_RE.test(id)) throw new Error(`invalid template id: ${id}`);
  return path.join(workspaceTemplatesDir(workspaceId), `${id}.json`);
}

function list(workspaceId) {
  return db
    .get()
    .prepare(
      `SELECT id, name, created_at, updated_at
       FROM templates_index
       WHERE workspace_id = ? AND deleted_at IS NULL
       ORDER BY updated_at DESC`
    )
    .all(workspaceId);
}

function listTrashed(workspaceId) {
  return db
    .get()
    .prepare(
      `SELECT id, name, created_at, updated_at, deleted_at
       FROM templates_index
       WHERE workspace_id = ? AND deleted_at IS NOT NULL
       ORDER BY deleted_at DESC`
    )
    .all(workspaceId);
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
  const name = doc && typeof doc.name === 'string' ? doc.name : 'Sin título';
  // Writes preserve existing deleted_at — restoring is an explicit op.
  db.get()
    .prepare(
      `INSERT INTO templates_index (id, workspace_id, name, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, updated_at = excluded.updated_at`
    )
    .run(id, workspaceId, name);
  return { id, workspaceId, name };
}

// Soft-delete: keep the JSON file and the index row, just mark deleted_at.
// Hard deletion happens via purge() or on workspace delete cascade.
function remove(workspaceId, id) {
  db.get()
    .prepare(
      `UPDATE templates_index
       SET deleted_at = datetime('now')
       WHERE workspace_id = ? AND id = ?`
    )
    .run(workspaceId, id);
  return true;
}

function restore(workspaceId, id) {
  db.get()
    .prepare(
      `UPDATE templates_index
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
    .prepare('DELETE FROM templates_index WHERE id = ? AND workspace_id = ?')
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
  return `tpl_${crypto.randomBytes(8).toString('hex')}`;
}

module.exports = { list, listTrashed, read, write, remove, restore, purge, rename, newId };
