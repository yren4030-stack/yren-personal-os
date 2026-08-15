import test from 'node:test'
import assert from 'node:assert/strict'

import { currentLocale, messages, t } from '../apps/desktop/renderer/src/i18n/index.mjs'

test('default user-facing locale is zh-CN', () => {
  assert.equal(currentLocale, 'zh-CN')
})

test('nav dictionary covers every sidebar item used by the renderer', () => {
  const nav = messages.nav
  const required = [
    'work', 'home', 'projects', 'canvas', 'calendar',
    'knowledge', 'knowledgeBase', 'files',
    'ai', 'agent', 'skills', 'automations', 'memory',
    'system', 'settings', 'comingSoon',
  ]
  for (const key of required) {
    assert.equal(typeof nav[key], 'string', `nav.${key} must be a string`)
    assert.ok(nav[key].length > 0, `nav.${key} must not be empty`)
  }
  // Groups match the requested zh-CN labels.
  assert.equal(nav.work, '工作')
  assert.equal(nav.home, '首页')
  assert.equal(nav.canvas, '无限画布')
  assert.equal(nav.comingSoon, '开发中')
})

test('page dictionaries cover the keys the UI renders', () => {
  const home = messages.home
  for (const key of ['title', 'subtitle', 'projects', 'tasks', 'pendingProposals', 'localAI', 'recentProjects', 'recentActivity', 'noProjects', 'noActivity', 'validationProject', 'validationMode', 'localMode', 'aiReady', 'aiStarting', 'aiUnavailable', 'externalNotUsed', 'externalUsed']) {
    assert.equal(typeof home[key], 'string', `home.${key}`)
  }
  const detail = messages.projectDetail
  for (const key of ['proposeNextStep', 'proposing', 'pendingProposals', 'noPendingProposals', 'tasks', 'noTasks', 'activity', 'noActivity', 'proposalRationale', 'approveAndCreateTask', 'statusPending', 'statusApproved', 'statusRejected', 'statusTodo', 'kindProject', 'kindTask', 'kindProposal']) {
    assert.equal(typeof detail[key], 'string', `projectDetail.${key}`)
  }
  const settings = messages.settings
  for (const key of ['title', 'subtitle', 'appearance', 'glassMaterial', 'frosted', 'transparent', 'frostIntensity', 'transparencyLevel', 'theme']) {
    assert.equal(typeof settings[key], 'string', `settings.${key}`)
  }
  // The two appearance sliders stay independent with their own labels.
  assert.equal(settings.frosted, '磨砂')
  assert.equal(settings.transparent, '通透')
  assert.equal(settings.frostIntensity, '磨砂强度')
  assert.equal(settings.transparencyLevel, '通透程度')
})

test('t() interpolates placeholders', () => {
  assert.equal(t('common.tasksCount', { n: 3 }), '3 个任务')
  assert.equal(t('projectDetail.taskCount', { n: 0 }), '0 个任务')
  assert.equal(t('projectDetail.proposalCount', { n: 1 }), '1 条待确认建议')
})

test('t() falls back to the key for missing messages', () => {
  assert.equal(t('missing.key'), 'missing.key')
  assert.equal(t('nav.notAKey'), 'nav.notAKey')
})
