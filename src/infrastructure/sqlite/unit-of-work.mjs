/**
 * SQLite adapter for the UnitOfWork port.
 *
 * Wraps a multi-repository write in a single BEGIN/COMMIT transaction so that
 * e.g. "create Task + mark Proposal approved" commits atomically. If `fn`
 * rejects, every write made inside `fn` is rolled back.
 *
 * Transactions are non-nesting: call `run` once at the top level.
 */
export class SqliteUnitOfWork {
  constructor(db) {
    this.db = db
  }

  async run(fn) {
    this.db.exec('BEGIN IMMEDIATE')
    try {
      const result = await fn()
      this.db.exec('COMMIT')
      return result
    } catch (error) {
      try {
        this.db.exec('ROLLBACK')
      } catch {
        // The transaction may already be aborted; nothing further to roll back.
      }
      throw error
    }
  }
}
