import { randomUUID } from 'node:crypto'
import { createReadonlyProjectContext, createTask } from '../domain/project/project.mjs'

export class ProjectReadProposeService {
  constructor({ projectRepository, taskRepository, agentRuntime, proposalRepository, clock = () => new Date() }) {
    this.projects = projectRepository
    this.tasks = taskRepository
    this.agentRuntime = agentRuntime
    this.proposals = proposalRepository
    this.clock = clock
  }

  async proposeNextStep(projectId) {
    const project = await this.projects.getById(projectId)
    if (!project) throw new Error(`project not found: ${projectId}`)
    const tasks = await this.tasks.listByProjectId(projectId)
    const context = createReadonlyProjectContext(project, tasks)

    const runtimeProposal = await this.agentRuntime.proposeNextProjectStep({ context })
    if (!runtimeProposal || typeof runtimeProposal.title !== 'string' || runtimeProposal.title.trim() === '') {
      throw new TypeError('agent runtime returned an invalid proposal')
    }

    const proposal = Object.freeze({
      id: randomUUID(),
      projectId,
      type: 'create-task',
      title: runtimeProposal.title.trim(),
      rationale: typeof runtimeProposal.rationale === 'string' ? runtimeProposal.rationale.trim() : '',
      status: 'pending-approval',
      createdAt: this.clock().toISOString(),
    })

    await this.proposals.save(proposal)
    return proposal
  }

  async approveProposal(proposalId) {
    const proposal = await this.proposals.getById(proposalId)
    if (!proposal) throw new Error(`proposal not found: ${proposalId}`)
    if (proposal.status !== 'pending-approval') throw new Error(`proposal is not pending: ${proposalId}`)

    const task = createTask({
      projectId: proposal.projectId,
      title: proposal.title,
      createdAt: this.clock().toISOString(),
    })
    await this.tasks.save(task)
    await this.proposals.replace(Object.freeze({ ...proposal, status: 'approved' }))

    return Object.freeze({ proposalId, task })
  }

  async rejectProposal(proposalId) {
    const proposal = await this.proposals.getById(proposalId)
    if (!proposal) throw new Error(`proposal not found: ${proposalId}`)
    if (proposal.status !== 'pending-approval') throw new Error(`proposal is not pending: ${proposalId}`)
    const rejected = Object.freeze({ ...proposal, status: 'rejected' })
    await this.proposals.replace(rejected)
    return rejected
  }
}
