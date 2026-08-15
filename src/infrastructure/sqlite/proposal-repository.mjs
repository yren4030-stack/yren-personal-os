/**
 * SQLite adapter for the ProposalRepository port.
 * All statements use bound parameters; no user data is interpolated into SQL.
 *
 * `save` and `replace` both upsert on the primary key, matching the in-memory
 * port semantics (idempotent set). The application uses `save` to create a new
 * pending proposal and `replace` to transition an existing proposal's status.
 */

function mapProposalRow(row) {
  return Object.freeze({
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    title: row.title,
    rationale: row.rationale,
    status: row.status,
    createdAt: row.created_at,
  })
}

export class SqliteProposalRepository {
  constructor(db) {
    this.getStmt = db.prepare(
      'SELECT id, project_id, type, title, rationale, status, created_at FROM proposals WHERE id = ?'
    )
    this.upsertStmt = db.prepare(
      `INSERT INTO proposals (id, project_id, type, title, rationale, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         project_id = excluded.project_id,
         type = excluded.type,
         title = excluded.title,
         rationale = excluded.rationale,
         status = excluded.status,
         created_at = excluded.created_at`
    )
  }

  async getById(id) {
    const row = this.getStmt.get(id)
    return row === undefined ? null : mapProposalRow(row)
  }

  async save(proposal) {
    this.upsertStmt.run(
      proposal.id,
      proposal.projectId,
      proposal.type,
      proposal.title,
      proposal.rationale,
      proposal.status,
      proposal.createdAt
    )
  }

  async replace(proposal) {
    this.upsertStmt.run(
      proposal.id,
      proposal.projectId,
      proposal.type,
      proposal.title,
      proposal.rationale,
      proposal.status,
      proposal.createdAt
    )
  }
}
