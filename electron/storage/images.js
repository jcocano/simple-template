const crypto = require('crypto');
const db = require('./db');
const imageFiles = require('./image-files');

function newId() {
  return `img_${crypto.randomBytes(6).toString('hex')}`;
}

function list(workspaceId) {
  if (!workspaceId) return [];
  return db
    .get()
    .prepare(
      `SELECT id, url, name, folder, mime, size_bytes, width, height, provider, local_path, created_at
       FROM images
       WHERE workspace_id = ?
       ORDER BY created_at DESC, id DESC`
    )
    .all(workspaceId)
    .map(row => ({
      id: row.id,
      url: row.url,
      name: row.name,
      folder: row.folder,
      mime: row.mime,
      sizeBytes: row.size_bytes,
      width: row.width,
      height: row.height,
      provider: row.provider,
      localPath: row.local_path,
      createdAt: row.created_at,
    }));
}

function add(workspaceId, entry) {
  if (!workspaceId || !entry?.url) return null;
  const id = entry.id || newId();
  // `folder` column is NOT NULL (see migration 0005). Renderer sends null
  // for "unassigned" since folders became first-class records — coerce to
  // empty string so the constraint holds. Renderer already treats both
  // null and '' as unassigned (see image-library.tsx filter).
  const folder = entry.folder == null ? '' : String(entry.folder);
  db.get()
    .prepare(
      `INSERT INTO images
        (id, workspace_id, url, name, folder, mime, size_bytes, width, height, provider, local_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      workspaceId,
      entry.url,
      entry.name || 'imagen',
      folder,
      entry.mime || null,
      entry.sizeBytes != null ? entry.sizeBytes : null,
      entry.width != null ? entry.width : null,
      entry.height != null ? entry.height : null,
      entry.provider || null,
      entry.localPath || null,
    );
  return get(workspaceId, id);
}

function get(workspaceId, id) {
  const row = db
    .get()
    .prepare(
      `SELECT id, url, name, folder, mime, size_bytes, width, height, provider, local_path, created_at
       FROM images
       WHERE workspace_id = ? AND id = ?`
    )
    .get(workspaceId, id);
  if (!row) return null;
  return {
    id: row.id,
    url: row.url,
    name: row.name,
    folder: row.folder,
    mime: row.mime,
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    provider: row.provider,
    localPath: row.local_path,
    createdAt: row.created_at,
  };
}

function remove(workspaceId, id) {
  if (!workspaceId || !id) return false;
  // Capture provider + local_path BEFORE delete. If row is local, also remove
  // disk file. Order: SELECT -> DELETE -> unlink.
  // If app crashes between DELETE and unlink, orphan files can remain; this is
  // acceptable (no automatic GC, but SQL state remains consistent).
  const row = db
    .get()
    .prepare('SELECT provider, local_path FROM images WHERE workspace_id = ? AND id = ?')
    .get(workspaceId, id);
  const result = db
    .get()
    .prepare('DELETE FROM images WHERE workspace_id = ? AND id = ?')
    .run(workspaceId, id);
  if (result.changes > 0 && row && row.provider === 'local' && row.local_path) {
    try { imageFiles.remove(workspaceId, row.local_path); } catch {}
  }
  return result.changes > 0;
}

function updateFolder(workspaceId, id, folder) {
  if (!workspaceId || !id) return null;
  // Same NOT NULL workaround as add(): null/undefined → '' (unassigned).
  const value = folder == null ? '' : String(folder);
  db.get()
    .prepare('UPDATE images SET folder = ? WHERE workspace_id = ? AND id = ?')
    .run(value, workspaceId, id);
  return get(workspaceId, id);
}

function rename(workspaceId, id, name) {
  if (!workspaceId || !id || !name) return null;
  db.get()
    .prepare('UPDATE images SET name = ? WHERE workspace_id = ? AND id = ?')
    .run(name, workspaceId, id);
  return get(workspaceId, id);
}

function folders(workspaceId) {
  if (!workspaceId) return [];
  return db
    .get()
    .prepare(
      `SELECT folder, COUNT(*) AS count
       FROM images
       WHERE workspace_id = ?
       GROUP BY folder
       ORDER BY folder ASC`
    )
    .all(workspaceId)
    .map(row => ({ folder: row.folder, count: row.count }));
}

module.exports = { list, add, get, remove, updateFolder, rename, folders, newId };
