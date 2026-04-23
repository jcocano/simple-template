const { safeStorage } = require('electron');
const db = require('./db');

function set(key, plaintext) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('safeStorage encryption not available on this system');
  }
  const buf = safeStorage.encryptString(String(plaintext));
  db.get()
    .prepare(
      `INSERT INTO secrets (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .run(key, buf);
}

function get(key) {
  const row = db.get().prepare('SELECT value FROM secrets WHERE key = ?').get(key);
  if (!row) return null;
  return safeStorage.decryptString(row.value);
}

function remove(key) {
  db.get().prepare('DELETE FROM secrets WHERE key = ?').run(key);
}

function backend() {
  try {
    if (typeof safeStorage.getSelectedStorageBackend === 'function') {
      return safeStorage.getSelectedStorageBackend();
    }
  } catch {}
  return 'unknown';
}

module.exports = { set, get, remove, backend };
