/**
 * Desktop Main process — the ONLY privileged owner of the product runtime
 * (SQLite composition + real DSH host binding + facade + appearance). It uses
 * the desktop composition root; it never defaults to a fake runtime and never
 * silently falls back to one.
 */
import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

import { createDesktopProductRuntime, DESKTOP_RUNTIME_MODES } from '../../../src/composition/desktop-product-runtime.mjs'
import { resolveDesktopHostChildEntry } from '../../../src/infrastructure/runtime/desktop-child-entry.mjs'
import { classifyDisplay, computeInitialBounds, clampBoundsToWorkArea, findDisplayForBounds } from '../../../src/infrastructure/desktop/display-environment.mjs'
import { seedValidationProjectIfEmpty } from '../../../src/application/desktop-validation-seed.mjs'
import { startDshMockServer } from '../../../test/support/dsh-mock-server.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const MOCK_SUCCESS_JSON = '{"title":"Review project priorities","rationale":"The current project context indicates this is the next useful step."}'

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

function resolveMode() {
  const mode = process.env.PERSONAL_OS_RUNTIME_MODE || DESKTOP_RUNTIME_MODES.VALIDATION_LOCAL_MOCK
  if (!Object.values(DESKTOP_RUNTIME_MODES).includes(mode)) {
    throw new Error(`unknown PERSONAL_OS_RUNTIME_MODE: ${mode}`)
  }
  return mode
}

let runtime
let mode

async function createRuntime() {
  mode = resolveMode()
  const dshRoot = process.env.PERSONAL_OS_DSH_ROOT

  if (mode === DESKTOP_RUNTIME_MODES.UNIT_TEST_FAKE) {
    throw new Error('unit-test-fake is not a valid Desktop Main runtime mode')
  }

  // Explicit DSH host child entry, resolved from stable dev contexts — NEVER
  // from a bundled module location (Vite would point at .vite/build/...).
  // Null means unresolved: the composition fails closed (no spawn).
  const hostChildEntry = resolveDesktopHostChildEntry({
    appPath: app.getAppPath(),
    bundleDir: __dirname,
    cwd: process.cwd(),
  })
  if (!hostChildEntry) {
    console.error('[desktop-runtime] failed at stage=child-entry-resolve code=CHILD_ENTRY_MISSING')
  } else {
    console.log(`[desktop-runtime] dsh child entry: ${hostChildEntry}`)
  }

  runtime = await createDesktopProductRuntime({
    mode,
    databasePath: join(app.getPath('userData'), 'personal-os.db'),
    appearanceStorage: jsonFileStorage(join(app.getPath('userData'), 'appearance.json')),
    dshRoot,
    hostChildEntry,
    startMockServer: () => startDshMockServer({ dshRoot, successText: MOCK_SUCCESS_JSON, repeatLast: true }),
  })
}

function registerIpc() {
  ipcMain.handle('personalOS:projects:list', () => runtime.facade.listProjects())
  ipcMain.handle('personalOS:projects:get', (_event, projectId) => runtime.facade.getProject(projectId))
  ipcMain.handle('personalOS:projects:getWorkspace', (_event, projectId) => runtime.facade.getWorkspace(projectId))
  ipcMain.handle('personalOS:projects:proposeNextStep', (_event, projectId) => runtime.facade.proposeNextStep(projectId))
  ipcMain.handle('personalOS:proposals:approve', (_event, proposalId) => runtime.facade.approveProposal(proposalId))
  ipcMain.handle('personalOS:proposals:reject', (_event, proposalId) => runtime.facade.rejectProposal(proposalId))
  ipcMain.handle('personalOS:appearance:get', () => runtime.facade.getAppearance())
  ipcMain.handle('personalOS:appearance:update', (_event, patch) => runtime.facade.updateAppearance(patch))
  ipcMain.handle('personalOS:runtime:status', () => runtime.facade.getRuntimeStatus())
}

function createWindow() {
  // Display-aware initial geometry (DIP): never exceeds the work area, is
  // centered, and scales with the effective desktop; DPI scaling is handled
  // by Electron (workArea is already device-independent).
  const primary = screen.getPrimaryDisplay()
  const bounds = computeInitialBounds({ workArea: primary.workArea })
  displayDebug('initial', primary, bounds)

  const win = new BrowserWindow({
    ...bounds,
    minWidth: 760,
    minHeight: 600,
    backgroundColor: '#f3f2f7',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  // MAIN_WINDOW_VITE_DEV_SERVER_URL / MAIN_WINDOW_VITE_NAME are injected by
  // @electron-forge/plugin-vite during the frozen Forge build chain.
  const devUrl = typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined' ? MAIN_WINDOW_VITE_DEV_SERVER_URL : process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    void win.loadURL(devUrl)
  } else {
    void win.loadFile(join(__dirname, '..', 'renderer', 'main_window', 'index.html'))
  }
  return win
}

/** Development-only display diagnostics; never shown in the UI. */
function displayDebug(label, display, bounds) {
  console.debug('[display-debug]', {
    label,
    displayId: display.id,
    workArea: display.workArea,
    scaleFactor: display.scaleFactor,
    windowBounds: bounds,
    displayClass: classifyDisplay({ ...display.workArea, scaleFactor: display.scaleFactor }),
  })
}

/** Re-home the window into a valid work area when its display disappears. */
function ensureWindowVisible(win) {
  if (!win || win.isDestroyed()) return
  const bounds = win.getBounds()
  const display = findDisplayForBounds(screen.getAllDisplays(), bounds)
  if (!display) {
    const workArea = screen.getPrimaryDisplay().workArea
    const clamped = clampBoundsToWorkArea(bounds, workArea)
    win.setBounds(clamped)
    displayDebug('rehomed', screen.getPrimaryDisplay(), clamped)
  }
}

app.whenReady().then(async () => {
  console.log('[desktop-runtime] validation bootstrap: start')
  await createRuntime()
  try {
    await runtime.start()
  } catch (error) {
    // The facade reports RUNTIME_UNAVAILABLE; the UI shows it. Do not crash.
    console.error('desktop runtime failed to start:', error)
  }
  // Validation-only bootstrap: seeds one deterministic project when the
  // database is empty and the mode is validation-local-mock. Never runs in
  // real-dsh / production / unit-test-fake / unknown modes.
  try {
    const seed = await seedValidationProjectIfEmpty({
      mode,
      projectRepository: runtime.composition.projectRepository,
    })
    if (seed.seeded) console.log(`[desktop] validation project seeded: ${seed.projectId}`)
  } catch (error) {
    console.error('desktop validation seed failed:', error)
  }
  registerIpc()
  const win = createWindow()

  // Multi-monitor safety: never leave the window off-screen when its display
  // disappears or metrics change. No aggressive automatic resizing while the
  // user drags between displays — the renderer adapts to the new viewport.
  screen.on('display-removed', () => ensureWindowVisible(win))
  screen.on('display-metrics-changed', () => ensureWindowVisible(win))

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  void (async () => {
    try {
      await runtime?.stop()
    } catch {
      // ignore
    }
    if (process.platform !== 'darwin') app.quit()
  })()
})
