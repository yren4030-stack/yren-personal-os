/**
 * Desktop Main process — the ONLY privileged owner of the SQLite composition,
 * the AgentRuntimePort implementation, the appearance service, and the facade.
 * The BrowserWindow never owns these; a Renderer reload never re-creates the
 * DB or a duplicate runtime.
 */
import { app, BrowserWindow, ipcMain } from 'electron'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

import { createProjectReadProposeComposition } from '../../../src/composition/project-read-propose-composition.mjs'
import { DesktopProductFacade } from '../../../src/application/desktop-product-facade.mjs'
import { AppearanceService } from '../../../src/application/appearance-service.mjs'
import { FakeAgentRuntime } from '../../../test/support/fake-agent-runtime.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

function jsonFileStorage(path) {
  return {
    load() {
      try {
        return JSON.parse(readFileSync(path, 'utf8'))
      } catch {
        return null
      }
    },
    save(state) {
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, JSON.stringify(state))
    },
  }
}

/**
 * The AgentRuntimePort implementation for this desktop shell. The first slice
 * uses the deterministic test runtime so the UI boots without any model
 * credential; the production DSH host binding plugs in here later without
 * touching the facade or the Renderer contract.
 */
function createAgentRuntime() {
  return new FakeAgentRuntime()
}

let composition
let facade

function createProductFacade() {
  const userData = app.getPath('userData')
  composition = createProjectReadProposeComposition({
    databasePath: join(userData, 'personal-os.db'),
    agentRuntime: createAgentRuntime(),
  })
  facade = new DesktopProductFacade({
    service: composition.service,
    projectRepository: composition.projectRepository,
    taskRepository: composition.taskRepository,
    proposalRepository: composition.proposalRepository,
    appearanceService: new AppearanceService(jsonFileStorage(join(userData, 'appearance.json'))),
  })
}

function registerIpc() {
  ipcMain.handle('personalOS:projects:list', () => facade.listProjects())
  ipcMain.handle('personalOS:projects:get', (_event, projectId) => facade.getProject(projectId))
  ipcMain.handle('personalOS:projects:getWorkspace', (_event, projectId) => facade.getWorkspace(projectId))
  ipcMain.handle('personalOS:projects:proposeNextStep', (_event, projectId) => facade.proposeNextStep(projectId))
  ipcMain.handle('personalOS:proposals:approve', (_event, proposalId) => facade.approveProposal(proposalId))
  ipcMain.handle('personalOS:proposals:reject', (_event, proposalId) => facade.rejectProposal(proposalId))
  ipcMain.handle('personalOS:appearance:get', () => facade.getAppearance())
  ipcMain.handle('personalOS:appearance:update', (_event, patch) => facade.updateAppearance(patch))
  ipcMain.handle('personalOS:runtime:status', () => facade.getRuntimeStatus())
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#f2f1f6',
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    void win.loadURL(devUrl)
  } else {
    void win.loadFile(join(__dirname, '..', 'renderer', 'dist', 'index.html'))
  }
  return win
}

app.whenReady().then(() => {
  createProductFacade()
  registerIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  try {
    composition?.close()
  } catch {
    // ignore
  }
  if (process.platform !== 'darwin') app.quit()
})
