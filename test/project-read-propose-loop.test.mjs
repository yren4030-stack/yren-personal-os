import test from 'node:test'
import assert from 'node:assert/strict'
import { createProject, createTask } from '../src/domain/project/project.mjs'
import { ProjectReadProposeService } from '../src/application/project-read-propose-loop.mjs'

class MemoryRepository {
  constructor(values = []) {
    this.values = new Map(values.map(value => [value.id, value]))
  }
  async getById(id) { return this.values.get(id) ?? null }
  async save(value) { this.values.set(value.id, value) }
  async replace(value) { this.values.set(value.id, value) }
}

class MemoryTaskRepository extends MemoryRepository {
  async listByProjectId(projectId) {
    return [...this.values.values()].filter(task => task.projectId === projectId)
  }
}

test('AI receives readonly project context and cannot mutate product state before approval', async () => {
  const project = createProject({ id: 'project-1', title: 'Personal OS' })
  const existing = createTask({ id: 'task-1', projectId: project.id, title: 'Establish desktop foundation' })
  const projects = new MemoryRepository([project])
  const tasks = new MemoryTaskRepository([existing])
  const proposals = new MemoryRepository()
  let capturedContext

  const service = new ProjectReadProposeService({
    projectRepository: projects,
    taskRepository: tasks,
    proposalRepository: proposals,
    agentRuntime: {
      async proposeNextProjectStep({ context }) {
        capturedContext = context
        assert.equal(Object.isFrozen(context), true)
        assert.equal(Object.isFrozen(context.project), true)
        assert.equal(Object.isFrozen(context.tasks), true)
        return {
          title: 'Implement Project bookshelf skeleton',
          rationale: 'The foundation is ready for the first visible product slice.',
        }
      },
    },
    clock: () => new Date('2026-08-15T04:40:00.000Z'),
  })

  const proposal = await service.proposeNextStep(project.id)

  assert.equal(capturedContext.project.id, project.id)
  assert.equal(capturedContext.tasks.length, 1)
  assert.equal(proposal.status, 'pending-approval')
  assert.equal((await tasks.listByProjectId(project.id)).length, 1)

  const approved = await service.approveProposal(proposal.id)
  assert.equal(approved.task.title, 'Implement Project bookshelf skeleton')
  assert.equal((await tasks.listByProjectId(project.id)).length, 2)
  assert.equal((await proposals.getById(proposal.id)).status, 'approved')
})

test('rejected AI proposal never creates a task', async () => {
  const project = createProject({ id: 'project-2', title: 'Personal OS' })
  const projects = new MemoryRepository([project])
  const tasks = new MemoryTaskRepository()
  const proposals = new MemoryRepository()

  const service = new ProjectReadProposeService({
    projectRepository: projects,
    taskRepository: tasks,
    proposalRepository: proposals,
    agentRuntime: {
      async proposeNextProjectStep() {
        return { title: 'Do not apply automatically', rationale: 'Proposal First.' }
      },
    },
  })

  const proposal = await service.proposeNextStep(project.id)
  const rejected = await service.rejectProposal(proposal.id)

  assert.equal(rejected.status, 'rejected')
  assert.equal((await tasks.listByProjectId(project.id)).length, 0)
})
