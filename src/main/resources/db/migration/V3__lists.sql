CREATE TABLE IF NOT EXISTS lists (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS entry_lists (
  entry_id TEXT NOT NULL,
  list_id TEXT NOT NULL,
  PRIMARY KEY (entry_id, list_id),
  FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lists_name ON lists(name);
CREATE INDEX IF NOT EXISTS idx_entry_lists_entry_id ON entry_lists(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_lists_list_id ON entry_lists(list_id);


