import test from 'node:test'
import assert from 'node:assert/strict'

import { currentLocale, messages, t } from '../apps/desktop/renderer/src/i18n/index.mjs'

test('default user-facing locale is zh-CN', () => {
  assert.equal(currentLocale, 'zh-CN')
})

test('global dictionary covers every global shell entry used by the renderer', () => {
  const global = messages.global
  const required = [
    'label', 'mainAi', 'mainAiDescription', 'search', 'searchDescription',
    'notifications', 'notificationsDescription', 'proposals', 'proposalsDescription',
    'quickCreate', 'quickCreateDescription', 'skeleton', 'notImplemented',
    'laterSlice', 'close', 'mainAiStatus', 'searchInputPlaceholder', 'searchStatus',
    'notificationsStatus', 'proposalsStatus', 'proposalsGoToProjects',
    'quickCreateStatus', 'quickCreateItems', 'currentContext',
  ]
  for (const key of required) {
    assert.equal(typeof global[key], 'string', `global.${key} must be a string`)
    assert.ok(global[key].length > 0, `global.${key} must not be empty`)
  }
})

test('nav dictionary covers every sidebar item used by the renderer', () => {
  const nav = messages.nav
  const required = [
    'spaces', 'secondary', 'home', 'homeDescription',
    'manage', 'manageDescription', 'projects', 'projectsDescription',
    'manageGoals', 'manageGoalsDescription', 'managePlanning', 'managePlanningDescription',
    'manageExecution', 'manageExecutionDescription', 'manageReview', 'manageReviewDescription',
    'library', 'libraryDescription', 'libraryKnowledge', 'libraryKnowledgeDescription',
    'libraryAssets', 'libraryAssetsDescription', 'libraryFiles', 'libraryFilesDescription',
    'libraryCollections', 'libraryCollectionsDescription',
    'create', 'createDescription', 'createAiLab', 'createAiLabDescription',
    'createCanvas', 'createCanvasDescription', 'createWorkflows', 'createWorkflowsDescription',
    'createOutputs', 'createOutputsDescription', 'publish', 'publishDescription',
    'publishCandidates', 'publishCandidatesDescription', 'publishPortfolio', 'publishPortfolioDescription',
    'publishPublicContent', 'publishPublicContentDescription', 'settings', 'settingsDescription',
    'skeleton', 'realCapability', 'comingSoon',
  ]
  for (const key of required) {
    assert.equal(typeof nav[key], 'string', `nav.${key} must be a string`)
    assert.ok(nav[key].length > 0, `nav.${key} must not be empty`)
  }
  // The six product spaces are the only first-level navigation labels.
  assert.equal(nav.spaces, '产品空间')
  assert.equal(nav.home, '首页')
  assert.equal(nav.manage, '管理')
  assert.equal(nav.library, '资料库 / 书架')
  assert.equal(nav.create, '创作')
  assert.equal(nav.publish, '发布')
  assert.equal(nav.settings, '设置')
  assert.equal(nav.comingSoon, '尚未实现')
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
  for (const key of ['title', 'subtitle', 'appearance', 'appearanceMode', 'appearanceModeDescription', 'themeLight', 'themeDark', 'themeSystem', 'liquidGlass', 'liquidGlassDescription', 'liquidGlassCurrent', 'glassStrength', 'glassStrengthValue', 'desktopBackground', 'desktopBackgroundDescription', 'desktopBackgroundCurrent']) {
    assert.equal(typeof settings[key], 'string', `settings.${key}`)
  }
  // macOS 26 appearance model: two user-facing axes, no technical controls.
  assert.equal(settings.appearanceMode, '外观模式')
  assert.equal(settings.themeLight, '浅色')
  assert.equal(settings.themeDark, '深色')
  assert.equal(settings.themeSystem, '自动')
  assert.equal(settings.liquidGlass, 'Liquid Glass')
  assert.equal(settings.liquidGlassCurrent, '当前：默认')
  assert.equal(settings.desktopBackground, '桌面背景')
  assert.equal('frostIntensity' in settings, false)
  assert.equal('transparencyLevel' in settings, false)
  assert.equal('glassEffect' in settings, false)
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
