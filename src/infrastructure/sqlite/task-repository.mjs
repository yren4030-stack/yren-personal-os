/**
 * SQLite adapter for the TaskRepository port.
 * All statements use bound parameters; no user data is interpolated into SQL.
 */

function mapTaskRow(row) {
  return Object.freeze({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
  })
}

export class SqliteTaskRepository {
  constructor(db) {
    this.getStmt = db.prepare(
      'SELECT id, project_id, title, status, priority, created_at FROM tasks WHERE id = ?'
    )
    this.listStmt = db.prepare(
      'SELECT id, project_id, title, status, priority, created_at FROM tasks WHERE project_id = ? ORDER BY created_at'
    )
    this.upsertStmt = db.prepare(
      `INSERT INTO tasks (id, project_id, title, status, priority, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         project_id = excluded.project_id,
         title = excluded.title,
         status = excluded.status,
         priority = excluded.priority,
         created_at = excluded.created_at`
    )
  }

  async getById(id) {
    const row = this.getStmt.get(id)
    return row === undefined ? null : mapTaskRow(row)
  }

  async save(task) {
    this.upsertStmt.run(
      task.id,
      task.projectId,
      task.title,
      task.status,
      task.priority,
      task.createdAt
    )
  }

  async listByProjectId(projectId) {
    return this.listStmt.all(projectId).map(mapTaskRow)
  }
}
