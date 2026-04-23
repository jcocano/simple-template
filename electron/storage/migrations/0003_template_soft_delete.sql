-- Soft-delete for templates. NULL = active, timestamp = in trash.
-- Hard deletion happens via the `purge` op or via workspace delete cascade.

ALTER TABLE templates_index ADD COLUMN deleted_at TEXT;

CREATE INDEX IF NOT EXISTS idx_templates_deleted ON templates_index(deleted_at);
