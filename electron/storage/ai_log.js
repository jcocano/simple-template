const db = require('./db');

const MAX_ENTRIES_PER_WORKSPACE = 500;

function add(workspaceId, entry) {
  if (!workspaceId || !entry) return null;
  const {
    provider, model, op,
    prompt, response, usage,
    ok, error,
  } = entry;
  const result = db
    .get()
    .prepare(
      `INSERT INTO ai_log
        (workspace_id, provider, model, op, prompt, response, usage_json, ok, error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      workspaceId,
      provider || 'unknown',
      model || null,
      op || 'other',
      prompt || null,
      response || null,
      usage ? JSON.stringify(usage) : null,
      ok === false ? 0 : 1,
      error || null,
    );
  prune(workspaceId);
  return result.lastInsertRowid;
}

// Rolling-window retention. Keeps the most recent MAX_ENTRIES_PER_WORKSPACE
// rows, deletes older ones. Called on every insert — cheap because the index
// on (workspace_id, created_at DESC) makes the lookup O(log n).
function prune(workspaceId) {
  db.get()
    .prepare(
      `DELETE FROM ai_log
       WHERE workspace_id = ?
         AND id NOT IN (
           SELECT id FROM ai_log
           WHERE workspace_id = ?
           ORDER BY created_at DESC, id DESC
           LIMIT ?
         )`
    )
    .run(workspaceId, workspaceId, MAX_ENTRIES_PER_WORKSPACE);
}

function list(workspaceId, { limit = 50, offset = 0 } = {}) {
  if (!workspaceId) return [];
  const rows = db
    .get()
    .prepare(
      `SELECT id, created_at, provider, model, op, prompt, response, usage_json, ok, error
       FROM ai_log
       WHERE workspace_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`
    )
    .all(workspaceId, limit, offset);
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    provider: r.provider,
    model: r.model,
    op: r.op,
    prompt: r.prompt,
    response: r.response,
    usage: r.usage_json ? safeParse(r.usage_json) : null,
    ok: !!r.ok,
    error: r.error,
  }));
}

function count(workspaceId) {
  if (!workspaceId) return 0;
  const row = db
    .get()
    .prepare('SELECT COUNT(*) AS n FROM ai_log WHERE workspace_id = ?')
    .get(workspaceId);
  return row?.n || 0;
}

function clear(workspaceId) {
  if (!workspaceId) return 0;
  const result = db
    .get()
    .prepare('DELETE FROM ai_log WHERE workspace_id = ?')
    .run(workspaceId);
  return result.changes;
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

module.exports = { add, list, count, clear, prune, MAX_ENTRIES_PER_WORKSPACE };
