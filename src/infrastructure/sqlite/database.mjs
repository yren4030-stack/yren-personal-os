import { DatabaseSync } from 'node:sqlite'

export const SCHEMA_VERSION = 1

const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS projects (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  status     TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  status     TEXT NOT NULL,
  priority   TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS proposals (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  rationale  TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON proposals(project_id);
`

/**
 * Open a SQLite database, enable foreign-key enforcement for this connection,
 * and apply the V1 schema migration. `location` is a file path or ':memory:'.
 */
export function openDatabase(location) {
  const db = new DatabaseSync(location)
  // Foreign-key enforcement is per-connection in SQLite and must be set on every open.
  db.exec('PRAGMA foreign_keys = ON')
  migrate(db)
  return db
}

/**
 * Idempotent versioned migration. Tracks the applied version with
 * `PRAGMA user_version` and only applies pending migrations.
 */
export function migrate(db) {
  const row = db.prepare('PRAGMA user_version').get()
  const current = Number(row?.user_version ?? 0)

  if (current < SCHEMA_VERSION) {
    db.exec('BEGIN')
    try {
      db.exec(SCHEMA_V1)
      // SCHEMA_VERSION is a code-level integer constant, never user input.
      db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`)
      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
  }
}
