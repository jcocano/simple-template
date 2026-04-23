const db = require('./db');

function get(key) {
  const row = db.get().prepare('SELECT value FROM settings WHERE key = ?').get(key);
  if (!row) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

function set(key, value) {
  db.get()
    .prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .run(key, JSON.stringify(value));
}

function remove(key) {
  db.get().prepare('DELETE FROM settings WHERE key = ?').run(key);
}

function list() {
  const rows = db.get().prepare('SELECT key, value FROM settings').all();
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
