/**
 * DesktopProductFacade — the single Product boundary between the Desktop
 * Renderer contract (window.personalOS.v1) and the Application layer.
 *
 * Queries are read-only; commands may mutate local persisted state. Every
 * method re-validates its input (the Renderer is untrusted) and returns a
 * stable JSON-safe result envelope. SQLite / DSH / Electron never cross this
 * boundary.
 */
import { ok, fail, ERROR_CODES, validateProjectId, validateProposalId, normalizeAppearancePatch } from './desktop-api.mjs'
import { ProjectQueryService } from './project-query-service.mjs'

export class DesktopProductFacade {
  constructor({ service, projectRepository, taskRepository, proposalRepository, appearanceService, runtimeMode = 'fixture', getRuntimeState = () => 'ready' }) {
    this.service = service
    this.query = new ProjectQueryService({ projectRepository, taskRepository, proposalRepository })
    this.appearance = appearanceService
    this.runtimeMode = runtimeMode
    this.getRuntimeState = getRuntimeState
  }

  // ---- queries ----

  async listProjects() {
    try {
      return ok(await this.query.listProjects())
    } catch {
      return fail(ERROR_CODES.INTERNAL_ERROR, 'failed to list projects')
    }
  }

  async getProject(projectId) {
    const invalid = validateProjectId(projectId)
    if (invalid) return invalid
    try {
      const data = await this.query.getProject(projectId)
      if (data === null) return fail(ERROR_CODES.PROJECT_NOT_FOUND, `project not found: ${projectId}`)
      return ok(data)
    } catch {
      return fail(ERROR_CODES.INTERNAL_ERROR, 'failed to read project')
    }
  }

  async getWorkspace(projectId) {
    const invalid = validateProjectId(projectId)
    if (invalid) return invalid
    try {
      const data = await this.query.getWorkspace(projectId)
      if (data === null) return fail(ERROR_CODES.PROJECT_NOT_FOUND, `project not found: ${projectId}`)
      return ok(data)
    } catch {
      return fail(ERROR_CODES.INTERNAL_ERROR, 'failed to read project workspace')
    }
  }

  getAppearance() {
    return ok(this.appearance.get())
  }

  getRuntimeStatus() {
    return ok({ mode: this.runtimeMode, state: this.getRuntimeState(), externalModel: false })
  }

  // ---- commands ----

  async proposeNextStep(projectId) {
    const invalid = validateProjectId(projectId)
    if (invalid) return invalid
    if (this.getRuntimeState() !== 'ready') {
      return fail(ERROR_CODES.RUNTIME_UNAVAILABLE, 'agent runtime is not ready', true)
    }
    try {
      const proposal = await this.service.proposeNextStep(projectId)
      return ok({ proposalId: proposal.id, title: proposal.title, rationale: proposal.rationale, status: proposal.status })
    } catch (error) {
      return this.mapAgentError(error)
    }
  }

  async approveProposal(proposalId) {
    const invalid = validateProposalId(proposalId)
    if (invalid) return invalid
    try {
      const result = await this.service.approveProposal(proposalId)
      return ok({ proposalId: result.proposalId, taskId: result.task.id, status: 'approved' })
    } catch (error) {
      return this.mapProposalError(error)
    }
  }

  async rejectProposal(proposalId) {
    const invalid = validateProposalId(proposalId)
    if (invalid) return invalid
    try {
      const result = await this.service.rejectProposal(proposalId)
      return ok({ proposalId: result.id, status: result.status })
    } catch (error) {
      return this.mapProposalError(error)
    }
  }

  async updateAppearance(patch) {
    const normalized = normalizeAppearancePatch(patch)
    if (!normalized.ok) return normalized
    try {
      return ok(this.appearance.update(normalized.patch))
    } catch {
      return fail(ERROR_CODES.INTERNAL_ERROR, 'failed to persist appearance')
    }
  }

  // ---- stable error mapping ----

  mapAgentError(error) {
    const code = error && error.code
    const msg = (error && error.message) || 'propose failed'
    if (code === 'INVALID_AGENT_PROPOSAL') return fail(ERROR_CODES.INVALID_AGENT_PROPOSAL, msg)
    if (code === 'AGENT_TURN_FAILED') return fail(ERROR_CODES.AGENT_TURN_FAILED, msg, true)
    if (code === 'AGENT_OUTPUT_MISSING') return fail(ERROR_CODES.AGENT_OUTPUT_MISSING, msg)
    if (/project not found/i.test(msg)) return fail(ERROR_CODES.PROJECT_NOT_FOUND, msg)
    if (/not ready|not configured|child exited|startup|not running/i.test(msg)) {
      return fail(ERROR_CODES.RUNTIME_UNAVAILABLE, msg, true)
    }
    return fail(ERROR_CODES.INTERNAL_ERROR, msg)
  }

  mapProposalError(error) {
    const msg = (error && error.message) || 'proposal command failed'
    if (/proposal not found/i.test(msg)) return fail(ERROR_CODES.PROPOSAL_NOT_FOUND, msg)
    if (/not pending/i.test(msg)) return fail(ERROR_CODES.PROPOSAL_NOT_PENDING, msg)
    return fail(ERROR_CODES.INTERNAL_ERROR, msg)
  }
}
