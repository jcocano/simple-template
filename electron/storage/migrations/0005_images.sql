-- Bundle M · Persistent image library (WordPress-style).
-- Each row is one uploaded image. `url` is authoritative for rendering; for
-- base64 uploads it holds the full data: URL. `provider` records who handled
-- the upload so a future "migrate to real CDN" flow can re-upload the right
-- sources. `folder` is a free-text label shown in the sidebar — not a FK.

CREATE TABLE images (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'Sin carpeta',
  mime TEXT,
  size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  provider TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_images_workspace_created
  ON images(workspace_id, created_at DESC);
