const db = require('./db');

function get(workspaceId, key) {
  const row = db
    .get()
    .prepare('SELECT value FROM workspace_settings WHERE workspace_id = ? AND key = ?')
    .get(workspaceId, key);
  if (!row) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

function set(workspaceId, key, value) {
  db.get()
    .prepare(
      `INSERT INTO workspace_settings (workspace_id, key, value, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(workspace_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .run(workspaceId, key, JSON.stringify(value));
}

function remove(workspaceId, key) {
  db.get()
    .prepare('DELETE FROM workspace_settings WHERE workspace_id = ? AND key = ?')
    .run(workspaceId, key);
}

function list(workspaceId) {
  const rows = db
    .get()
    .prepare('SELECT key, value FROM workspace_settings WHERE workspace_id = ?')
    .all(workspaceId);
  const out = {};
  for (const r of rows) {
    try {
      out[r.key] = JSON.parse(r.value);
    } catch {
      out[r.key] = null;
    }
  }
  return out;
}

module.exports = { get, set, remove, list };
