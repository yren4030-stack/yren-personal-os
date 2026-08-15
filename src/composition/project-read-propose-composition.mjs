/**
 * Composition root for the persistent Project Read/Propose Loop.
 *
 * Wires the domain + application service to the SQLite infrastructure adapters
 * and an AgentRuntimePort implementation. It is a plain explicit factory — no
 * DI container, no global singleton, and no database opened at import time.
 *
 * The caller supplies `databasePath`; the database is opened lazily here and
 * released through `close()` / `dispose()`.
 */
import { ProjectReadProposeService } from '../application/project-read-propose-loop.mjs'
import { createSqlitePersistence } from '../infrastructure/sqlite/index.mjs'

export function createProjectReadProposeComposition({ databasePath, agentRuntime, clock }) {
  if (!agentRuntime || typeof agentRuntime.proposeNextProjectStep !== 'function') {
    throw new TypeError('agentRuntime must implement AgentRuntimePort.proposeNextProjectStep')
  }

  // Opens the DB, enables foreign keys, and runs the schema migration.
  const persistence = createSqlitePersistence(databasePath)

  const service = new ProjectReadProposeService({
    projectRepository: persistence.projectRepository,
    taskRepository: persistence.taskRepository,
    proposalRepository: persistence.proposalRepository,
    unitOfWork: persistence.unitOfWork,
    agentRuntime,
    clock,
  })

  let closed = false
  const close = () => {
    if (closed) return
    closed = true
    persistence.close()
  }

  return {
    service,
    projectRepository: persistence.projectRepository,
    taskRepository: persistence.taskRepository,
    proposalRepository: persistence.proposalRepository,
    unitOfWork: persistence.unitOfWork,
    db: persistence.db,
    close,
    dispose: close,
  }
}
