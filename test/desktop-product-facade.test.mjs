import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createProjectReadProposeComposition } from '../src/composition/project-read-propose-composition.mjs'
import { createProject, createTask } from '../src/domain/project/project.mjs'
import { FakeAgentRuntime } from './support/fake-agent-runtime.mjs'
import { DesktopProductFacade } from '../src/application/desktop-product-facade.mjs'
import { AppearanceService } from '../src/application/appearance-service.mjs'
import { ERROR_CODES } from '../src/application/desktop-api.mjs'

const T0 = '2026-08-15T04:40:00.000Z'

function memoryStorage(initial) {
  let state = initial
  return {
    load: () => state,
    save: (s) => {
      state = s
    },
  }
}

function makeFacade(t) {
  const dir = mkdtempSync(join(tmpdir(), 'yren-04a-'))
  const composition = createProjectReadProposeComposition({
    databasePath: join(dir, 'test.db'),
    agentRuntime: new FakeAgentRuntime(),
    clock: () => new Date(T0),
  })
  const facade = new DesktopProductFacade({
    service: composition.service,
    projectRepository: composition.projectRepository,
    taskRepository: composition.taskRepository,
    proposalRepository: composition.proposalRepository,
    appearanceService: new AppearanceService(memoryStorage()),
  })
  t.after(() => {
    composition.close()
    rmSync(dir, { recursive: true, force: true })
  })
  return { facade, composition }
}

test('listProjects returns an empty list when no projects exist', async (t) => {
  const { facade } = makeFacade(t)
  const result = await facade.listProjects()
  assert.deepEqual(result, { ok: true, data: [] })
})

test('getWorkspace returns PROJECT_NOT_FOUND for an unknown project', async (t) => {
  const { facade } = makeFacade(t)
  const result = await facade.getWorkspace('missing')
  assert.equal(result.ok, false)
  assert.equal(result.error.code, ERROR_CODES.PROJECT_NOT_FOUND)
})

test('invalid projectId / proposalId are rejected as INVALID_REQUEST', async (t) => {
  const { facade } = makeFacade(t)
  for (const result of [
    await facade.getWorkspace(''),
    await facade.proposeNextStep(123),
    await facade.approveProposal(null),
    await facade.rejectProposal(undefined),
  ]) {
    assert.equal(result.ok, false)
    assert.equal(result.error.code, ERROR_CODES.INVALID_REQUEST)
  }
})

test('propose persists a pending proposal and does not create a task; approve adds one', async (t) => {
  const { facade, composition } = makeFacade(t)
  await composition.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))
  await composition.taskRepository.save(createTask({ id: 't1', projectId: 'p1', title: 'Existing', createdAt: T0 }))

  const propose = await facade.proposeNextStep('p1')
  assert.equal(propose.ok, true)
  assert.equal(propose.data.status, 'pending-approval')

  let ws = await facade.getWorkspace('p1')
  assert.equal(ws.ok, true)
  assert.equal(ws.data.summary.taskCount, 1)
  assert.equal(ws.data.summary.pendingProposalCount, 1)

  const approve = await facade.approveProposal(propose.data.proposalId)
  assert.equal(approve.ok, true)
  assert.equal(approve.data.status, 'approved')

  ws = await facade.getWorkspace('p1')
  assert.equal(ws.data.summary.taskCount, 2)
  assert.equal(ws.data.summary.pendingProposalCount, 0)
})

test('reject does not create a task', async (t) => {
  const { facade, composition } = makeFacade(t)
  await composition.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))

  const propose = await facade.proposeNextStep('p1')
  const reject = await facade.rejectProposal(propose.data.proposalId)
  assert.equal(reject.ok, true)
  assert.equal(reject.data.status, 'rejected')

  const ws = await facade.getWorkspace('p1')
  assert.equal(ws.data.summary.taskCount, 0)
})

test('approve on a non-pending proposal returns PROPOSAL_NOT_PENDING', async (t) => {
  const { facade, composition } = makeFacade(t)
  await composition.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))
  const propose = await facade.proposeNextStep('p1')
  await facade.rejectProposal(propose.data.proposalId)
  const again = await facade.approveProposal(propose.data.proposalId)
  assert.equal(again.ok, false)
  assert.equal(again.error.code, ERROR_CODES.PROPOSAL_NOT_PENDING)
})

test('DTOs are JSON-safe plain data (serializable round-trip)', async (t) => {
  const { facade, composition } = makeFacade(t)
  await composition.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))
  const ws = await facade.getWorkspace('p1')
  // JSON round-trip must preserve the envelope (no class instances, Dates, Maps...)
  assert.deepEqual(JSON.parse(JSON.stringify(ws)), ws)
  const projects = await facade.listProjects()
  assert.deepEqual(JSON.parse(JSON.stringify(projects)), projects)
})

test('appearance update persists and reapplies across a new facade on the same storage', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'yren-04a-app-'))
  const composition = createProjectReadProposeComposition({
    databasePath: join(dir, 'test.db'),
    agentRuntime: new FakeAgentRuntime(),
  })
  t.after(() => {
    composition.close()
    rmSync(dir, { recursive: true, force: true })
  })
  const storage = memoryStorage()
  const facade = new DesktopProductFacade({
    service: composition.service,
    projectRepository: composition.projectRepository,
    taskRepository: composition.taskRepository,
    proposalRepository: composition.proposalRepository,
    appearanceService: new AppearanceService(storage),
  })

  const update = await facade.updateAppearance({ material: 'transparent', frostIntensity: 25, transparencyLevel: 80, theme: 'dark' })
  assert.equal(update.ok, true)
  assert.deepEqual(update.data, { material: 'transparent', frostIntensity: 25, transparencyLevel: 80, theme: 'dark', liquidGlassStyle: 'clear', glassStrength: 60 })

  const secondFacade = new DesktopProductFacade({
    service: composition.service,
    projectRepository: composition.projectRepository,
    taskRepository: composition.taskRepository,
    proposalRepository: composition.proposalRepository,
    appearanceService: new AppearanceService(storage),
  })
  const get = secondFacade.getAppearance()
  assert.deepEqual(get.data, { material: 'transparent', frostIntensity: 25, transparencyLevel: 80, theme: 'dark', liquidGlassStyle: 'clear', glassStrength: 60 })
})

test('appearance patch rejects unknown fields and clamps out-of-range values', async (t) => {
  const { facade } = makeFacade(t)
  const bad = await facade.updateAppearance({ unknown: 1 })
  assert.equal(bad.ok, false)
  assert.equal(bad.error.code, ERROR_CODES.INVALID_REQUEST)

  const clamped = await facade.updateAppearance({ frostIntensity: 500, transparencyLevel: -5 })
  assert.equal(clamped.ok, true)
  assert.equal(clamped.data.frostIntensity, 100)
  assert.equal(clamped.data.transparencyLevel, 0)
})
