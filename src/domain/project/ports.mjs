/**
 * Repository ports for the Project Read / Propose Loop.
 *
 * These are structural contracts (duck-typed). The application layer depends
 * on these ports only; it never imports `node:sqlite` and never knows whether
 * the storage behind a port is in-memory, SQLite, or something else.
 *
 * SQLite is an infrastructure adapter that implements these ports.
 *
 * @typedef {object} ProjectRepository
 * @property {(id: string) => Promise<object|null>} getById
 * @property {(project: object) => Promise<void>} save
 *
 * @typedef {object} TaskRepository
 * @property {(id: string) => Promise<object|null>} getById
 * @property {(task: object) => Promise<void>} save
 * @property {(projectId: string) => Promise<object[]>} listByProjectId
 *
 * @typedef {object} ProposalRepository
 * @property {(id: string) => Promise<object|null>} getById
 * @property {(proposal: object) => Promise<void>} save
 * @property {(proposal: object) => Promise<void>} replace
 *
 * @typedef {object} UnitOfWork
 * @property {<T>(fn: () => Promise<T>) => Promise<T>} run
 *   Runs `fn` inside one atomic transaction. If `fn` rejects, every write made
 *   inside `fn` is rolled back.
 */

export const PROJECT_REPOSITORY_METHODS = Object.freeze(['getById', 'save'])
export const TASK_REPOSITORY_METHODS = Object.freeze(['getById', 'save', 'listByProjectId'])
export const PROPOSAL_REPOSITORY_METHODS = Object.freeze(['getById', 'save', 'replace'])
export const UNIT_OF_WORK_METHODS = Object.freeze(['run'])
