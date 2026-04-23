const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const { workspaceTemplatesDir, workspaceImagesDir } = require('./paths');

function list() {
  return db
    .get()
    .prepare('SELECT id, name, created_at, updated_at FROM workspaces ORDER BY created_at ASC')
    .all();
}

function get(id) {
  return db
    .get()
    .prepare('SELECT id, name, created_at, updated_at FROM workspaces WHERE id = ?')
    .get(id);
}

function newId() {
  return `ws_${crypto.randomBytes(6).toString('hex')}`;
}

function create(name) {
  const id = newId();
  db.get()
    .prepare('INSERT INTO workspaces (id, name) VALUES (?, ?)')
    .run(id, name || 'Sin nombre');
  return get(id);
}

function rename(id, name) {
  db.get()
    .prepare("UPDATE workspaces SET name = ?, updated_at = datetime('now') WHERE id = ?")
    .run(name, id);
  return get(id);
}

function countTemplates(id) {
  const row = db
    .get()
    .prepare('SELECT COUNT(*) AS n FROM templates_index WHERE workspace_id = ?')
    .get(id);
  return row ? row.n : 0;
}

function remove(id) {
  const countWs = db.get().prepare('SELECT COUNT(*) AS n FROM workspaces').get().n;
  if (countWs <= 1) {
    throw new Error('LAST_WORKSPACE');
  }

  // Snapshot template ids BEFORE the SQL cascade wipes them.
  const templateIds = db
    .get()
    .prepare('SELECT id FROM templates_index WHERE workspace_id = ?')
    .all(id)
    .map((r) => r.id);

  // SQL side: secrets (manual LIKE prefix) + workspace row (cascades to
  // templates_index and workspace_settings via FK).
  db.get().transaction(() => {
    db.get().prepare('DELETE FROM secrets WHERE key LIKE ?').run(`ws:${id}:%`);
    db.get().prepare('DELETE FROM workspaces WHERE id = ?').run(id);
  })();

  // File system cleanup happens AFTER the SQL commit so a crash leaves
  // orphan JSON files rather than orphan SQL rows referring to missing files.
  const wsDir = workspaceTemplatesDir(id);
  for (const tid of templateIds) {
    try {
      const p = path.join(wsDir, `${tid}.json`);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (err) {
      console.error('[workspaces] unlink template', tid, err);
    }
  }
  try {
    if (fs.existsSync(wsDir)) fs.rmdirSync(wsDir);
  } catch {}

  // Carpeta de imágenes locales del workspace (mode='local'). La tabla
  // images ya se limpió por el CASCADE; acá borramos los archivos del disco.
  const imgDir = workspaceImagesDir(id);
  try {
    if (fs.existsSync(imgDir)) fs.rmSync(imgDir, { recursive: true, force: true });
  } catch (err) {
    console.error('[workspaces] remove images dir', id, err);
  }

  return { id, templatesRemoved: templateIds.length };
}

module.exports = { list, get, newId, create, rename, remove, countTemplates };
