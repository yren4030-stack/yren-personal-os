/**
 * Desktop validation bootstrap — seeds ONE deterministic project so the real
 * GUI can exercise the full Renderer -> IPC -> Application -> DSH -> SQLite
 * flow in validation mode.
 *
 * Strict rules:
 *   - Runs ONLY when mode === "validation-local-mock" (never real-dsh,
 *     production, unit-test-fake, or unknown modes).
 *   - Runs ONLY when the database holds zero projects. If ANY project exists,
 *     it does nothing — the validation project is never duplicated.
 *   - Uses the domain factory (createProject) and the repository port only.
 *     No raw SQL, no domain bypass, no fake renderer data.
 *
 * Production behavior is untouched: an empty database stays empty outside
 * validation-local-mock mode.
 */
import { createProject } from '../domain/project/project.mjs'

export const VALIDATION_RUNTIME_MODE = 'validation-local-mock'
export const VALIDATION_PROJECT_ID = 'validation-project'
export const VALIDATION_PROJECT_TITLE = 'Personal OS Validation Project'

/**
 * @param {object} options
 * @param {string} options.mode  desktop runtime mode (from DESKTOP_RUNTIME_MODES)
 * @param {{ list: () => Promise<object[]>, save: (project) => Promise<void> }} options.projectRepository
 * @returns {Promise<{ seeded: boolean, reason?: string, projectId?: string, title?: string }>}
 */
export async function seedValidationProjectIfEmpty({ mode, projectRepository }) {
  if (mode !== VALIDATION_RUNTIME_MODE) {
    return { seeded: false, reason: 'mode-not-validation' }
  }

  const existing = await projectRepository.list()
  if (existing.length > 0) {
    return { seeded: false, reason: 'database-not-empty' }
  }

  const project = createProject({ id: VALIDATION_PROJECT_ID, title: VALIDATION_PROJECT_TITLE })
  await projectRepository.save(project)
  return { seeded: true, projectId: project.id, title: project.title }
}
