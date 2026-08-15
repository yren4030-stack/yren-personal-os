import { openDatabase } from './database.mjs'
import { SqliteProjectRepository } from './project-repository.mjs'
import { SqliteTaskRepository } from './task-repository.mjs'
import { SqliteProposalRepository } from './proposal-repository.mjs'
import { SqliteUnitOfWork } from './unit-of-work.mjs'

export { SCHEMA_VERSION, migrate, openDatabase } from './database.mjs'

/**
 * Build a complete SQLite persistence layer for the Project Read/Propose Loop.
 *
 * Returns repositories implementing the domain ports plus a UnitOfWork that
 * makes multi-repository writes atomic. All adapters share one DatabaseSync
 * connection, so the UnitOfWork's transaction spans every repository.
 */
export function createSqlitePersistence(location) {
  const db = openDatabase(location)
  return {
    db,
    projectRepository: new SqliteProjectRepository(db),
    taskRepository: new SqliteTaskRepository(db),
    proposalRepository: new SqliteProposalRepository(db),
    unitOfWork: new SqliteUnitOfWork(db),
    close() {
      db.close()
    },
  }
}
