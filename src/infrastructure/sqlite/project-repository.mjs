/**
 * SQLite adapter for the ProjectRepository port.
 * All statements use bound parameters; no user data is interpolated into SQL.
 */

function mapProjectRow(row) {
  return Object.freeze({
    id: row.id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
  })
}

export class SqliteProjectRepository {
  constructor(db) {
    this.getStmt = db.prepare(
      'SELECT id, title, status, created_at FROM projects WHERE id = ?'
    )
    this.upsertStmt = db.prepare(
      `INSERT INTO projects (id, title, status, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         status = excluded.status,
         created_at = excluded.created_at`
    )
  }

  async getById(id) {
    const row = this.getStmt.get(id)
    return row === undefined ? null : mapProjectRow(row)
  }

  async save(project) {
    this.upsertStmt.run(project.id, project.title, project.status, project.createdAt)
  }
}
