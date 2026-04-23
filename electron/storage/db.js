const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { dbPath, ensureDirs } = require('./paths');

let db = null;

function init() {
  if (db) return db;
  ensureDirs();
  db = new Database(dbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate();
  return db;
}

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  const dir = path.join(__dirname, 'migrations');
  const applied = new Set(
    db.prepare('SELECT name FROM migrations').all().map((r) => r.name)
  );
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const f of files) {
    if (applied.has(f)) continue;
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run(f);
    })();
  }
}

function get() {
  if (!db) init();
  return db;
}

module.exports = { init, get };
