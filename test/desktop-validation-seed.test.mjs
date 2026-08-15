import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createSqlitePersistence } from '../src/infrastructure/sqlite/index.mjs'
import { createProject } from '../src/domain/project/project.mjs'
import { ProjectQueryService } from '../src/application/project-query-service.mjs'
import {
  seedValidationProjectIfEmpty,
  VALIDATION_RUNTIME_MODE,
  VALIDATION_PROJECT_ID,
  VALIDATION_PROJECT_TITLE,
} from '../src/application/desktop-validation-seed.mjs'

// Every test DB lives in a per-test temp directory and is removed afterwards.
function tempPersistence(t) {
  const dir = mkdtempSync(join(tmpdir(), 'yren-seed-'))
  const path = join(dir, 'test.db')
  const persistence = createSqlitePersistence(path)
  t.after(() => {
    try {
      persistence.close()
    } catch {
      // already closed
    }
    rmSync(dir, { recursive: true, force: true })
  })
  return persistence
}

test('validation-local-mock + empty DB seeds exactly one validation project', async (t) => {
  const persistence = tempPersistence(t)
  const result = await seedValidationProjectIfEmpty({
    mode: VALIDATION_RUNTIME_MODE,
    projectRepository: persistence.projectRepository,
  })

  assert.equal(result.seeded, true)
  assert.equal(result.projectId, VALIDATION_PROJECT_ID)
  assert.equal(result.title, VALIDATION_PROJECT_TITLE)

  const projects = await persistence.projectRepository.list()
  assert.equal(projects.length, 1)
  assert.equal(projects[0].id, VALIDATION_PROJECT_ID)
  assert.equal(projects[0].title, VALIDATION_PROJECT_TITLE)
})

test('second startup keeps exactly one project (no duplicate seed)', async (t) => {
  const persistence = tempPersistence(t)
  const first = await seedValidationProjectIfEmpty({
    mode: VALIDATION_RUNTIME_MODE,
    projectRepository: persistence.projectRepository,
  })
  assert.equal(first.seeded, true)

  // Simulate the next app launch against the same persisted database.
  const second = await seedValidationProjectIfEmpty({
    mode: VALIDATION_RUNTIME_MODE,
    projectRepository: persistence.projectRepository,
  })
  assert.equal(second.seeded, false)
  assert.equal(second.reason, 'database-not-empty')

  const projects = await persistence.projectRepository.list()
  assert.equal(projects.length, 1)
  assert.equal(projects[0].id, VALIDATION_PROJECT_ID)
})

test('existing project (any) prevents the validation seed entirely', async (t) => {
  const persistence = tempPersistence(t)
  const userProject = createProject({ title: 'User Created Project' })
  await persistence.projectRepository.save(userProject)

  const result = await seedValidationProjectIfEmpty({
    mode: VALIDATION_RUNTIME_MODE,
    projectRepository: persistence.projectRepository,
  })
  assert.equal(result.seeded, false)
  assert.equal(result.reason, 'database-not-empty')

  const projects = await persistence.projectRepository.list()
  assert.equal(projects.length, 1)
  assert.equal(projects[0].id, userProject.id)
  assert.equal(projects[0].title, 'User Created Project')
})

test('real-dsh mode never auto-creates projects', async (t) => {
  const persistence = tempPersistence(t)
  const result = await seedValidationProjectIfEmpty({
    mode: 'real-dsh',
    projectRepository: persistence.projectRepository,
  })
  assert.equal(result.seeded, false)
  assert.equal(result.reason, 'mode-not-validation')
  assert.equal((await persistence.projectRepository.list()).length, 0)
})

test('production / unit-test-fake / unknown modes never auto-create projects', async (t) => {
  for (const mode of ['production', 'unit-test-fake', 'unknown-mode', '']) {
    const persistence = tempPersistence(t)
    const result = await seedValidationProjectIfEmpty({ mode, projectRepository: persistence.projectRepository })
    assert.equal(result.seeded, false, `mode ${JSON.stringify(mode)} must not seed`)
    assert.equal(result.reason, 'mode-not-validation')
    assert.equal((await persistence.projectRepository.list()).length, 0, `mode ${JSON.stringify(mode)} left projects`)
  }
})

test('seeded project is visible through the normal read model', async (t) => {
  const persistence = tempPersistence(t)
  await seedValidationProjectIfEmpty({
    mode: VALIDATION_RUNTIME_MODE,
    projectRepository: persistence.projectRepository,
  })

  // The Renderer reads through the facade -> ProjectQueryService, which uses
  // the same repositories. No special "getValidationProject" API exists.
  const query = new ProjectQueryService({
    projectRepository: persistence.projectRepository,
    taskRepository: persistence.taskRepository,
    proposalRepository: persistence.proposalRepository,
  })

  const summaries = await query.listProjects()
  assert.equal(summaries.length, 1)
  assert.equal(summaries[0].id, VALIDATION_PROJECT_ID)
  assert.equal(summaries[0].title, VALIDATION_PROJECT_TITLE)
  assert.equal(summaries[0].status, 'active')
  assert.equal(summaries[0].taskCount, 0)
  assert.equal(summaries[0].completedTaskCount, 0)

  const detail = await query.getProject(VALIDATION_PROJECT_ID)
  assert.equal(detail.id, VALIDATION_PROJECT_ID)
  assert.equal(detail.title, VALIDATION_PROJECT_TITLE)

  const workspace = await query.getWorkspace(VALIDATION_PROJECT_ID)
  assert.equal(workspace.project.title, VALIDATION_PROJECT_TITLE)
  assert.deepEqual(workspace.tasks, [])
  assert.deepEqual(workspace.proposals, [])
  assert.equal(workspace.summary.pendingProposalCount, 0)
  assert.equal(workspace.activity.length, 1)
  assert.equal(workspace.activity[0].kind, 'project')
  assert.equal(workspace.activity[0].title, VALIDATION_PROJECT_TITLE)
})
