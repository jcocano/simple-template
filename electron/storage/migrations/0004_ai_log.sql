-- K.3.1 · AI conversation log (gated by `ai.log` setting).
-- Scoped per-workspace via FK; ON DELETE CASCADE removes entries when the
-- workspace is deleted. Retention is enforced in code, not SQL.

CREATE TABLE ai_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  provider TEXT NOT NULL,
  model TEXT,
  op TEXT NOT NULL,
  prompt TEXT,
  response TEXT,
  usage_json TEXT,
  ok INTEGER NOT NULL DEFAULT 1,
  error TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_log_ws_created
  ON ai_log(workspace_id, created_at DESC);
