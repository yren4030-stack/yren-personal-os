/**
 * Desktop Main process — the ONLY privileged owner of the product runtime
 * (SQLite composition + real DSH host binding + facade + appearance). It uses
 * the desktop composition root; it never defaults to a fake runtime and never
 * silently falls back to one.
 */
import { app, BrowserWindow, dialog, ipcMain, protocol, screen } from 'electron'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

import { createDesktopProductRuntime, DESKTOP_RUNTIME_MODES } from '../../../src/composition/desktop-product-runtime.mjs'
import { resolveDesktopHostChildEntry } from '../../../src/infrastructure/runtime/desktop-child-entry.mjs'
import { classifyDisplay, computeInitialBounds, clampBoundsToWorkArea, findDisplayForBounds } from '../../../src/infrastructure/desktop/display-environment.mjs'
import { seedValidationProjectIfEmpty } from '../../../src/application/desktop-validation-seed.mjs'
import { startDshMockServer } from '../../../test/support/dsh-mock-server.mjs'
import { ERROR_CODES } from '../../../src/application/desktop-api.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const MOCK_SUCCESS_JSON = '{"title":"Review project priorities","rationale":"The current project context indicates this is the next useful step."}'
const DESKTOP_BACKGROUND_MAX_BYTES = 25 * 1024 * 1024
const DESKTOP_BACKGROUND_RULES = Object.freeze({
  '.png': { label: 'PNG', magic: (header) => header.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' },
  '.jpg': { label: 'JPEG', magic: (header) => header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff },
  '.jpeg': { label: 'JPEG', magic: (header) => header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff },
  '.webp': { label: 'WEBP', magic: (header) => header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WEBP' },
})

protocol.registerSchemesAsPrivileged([{
  scheme: 'yren-appearance',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
}])

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

function managedAppearanceAssetDirectory() {
  return join(app.getPath('userData'), 'appearance-assets')
}

function validateDesktopBackgroundFile(sourcePath) {
  try {
    const extension = sourcePath.slice(sourcePath.lastIndexOf('.')).toLowerCase()
    const rule = DESKTOP_BACKGROUND_RULES[extension]
    const stat = statSync(sourcePath)
    if (!stat.isFile() || stat.size <= 0 || stat.size > DESKTOP_BACKGROUND_MAX_BYTES || !rule) return false
    const header = readFileSync(sourcePath).subarray(0, 16)
    return rule.magic(header)
  } catch {
    return false
  }
}

function registerAppearanceAssetProtocol() {
  protocol.handle('yren-appearance', (request) => {
    try {
      const url = new URL(request.url)
      const fileName = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
      const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
      const rule = DESKTOP_BACKGROUND_RULES[extension]
      if (url.hostname !== 'appearance' || !/^desktop-background-[a-z0-9-]+\.(png|jpg|jpeg|webp)$/i.test(fileName) || !rule) {
        return new Response('Not Found', { status: 404 })
      }
      const sourcePath = join(managedAppearanceAssetDirectory(), fileName)
      if (!validateDesktopBackgroundFile(sourcePath)) return new Response('Not Found', { status: 404 })
      const mime = rule.label === 'PNG' ? 'image/png' : rule.label === 'WEBP' ? 'image/webp' : 'image/jpeg'
      return new Response(readFileSync(sourcePath), {
        status: 200,
        headers: { 'content-type': mime, 'cache-control': 'no-store' },
      })
    } catch {
      return new Response('Not Found', { status: 404 })
    }
  })
}

async function chooseDesktopBackground() {
  const selection = await dialog.showOpenDialog({
    title: 'Choose Desktop Background',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
  })
  if (selection.canceled || selection.filePaths.length === 0) return { ok: true, data: runtime.appearance.get(), cancelled: true }
  const sourcePath = selection.filePaths[0]
  if (!validateDesktopBackgroundFile(sourcePath)) {
    return { ok: false, error: { code: ERROR_CODES.INVALID_REQUEST, message: 'unsupported or invalid desktop background image' } }
  }
  try {
    const extension = sourcePath.slice(sourcePath.lastIndexOf('.')).toLowerCase()
    const assetId = `desktop-background-${randomUUID()}`
    const targetPath = join(managedAppearanceAssetDirectory(), `${assetId}${extension}`)
    mkdirSync(managedAppearanceAssetDirectory(), { recursive: true })
    copyFileSync(sourcePath, targetPath)
    const desktopBackground = { kind: 'custom', assetId, url: `yren-appearance://appearance/${assetId}${extension}` }
    return { ok: true, data: runtime.appearance.update({ desktopBackground }) }
  } catch {
    return { ok: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'failed to store desktop background' } }
  }
}

function resetDesktopBackground() {
  return { ok: true, data: runtime.appearance.update({ desktopBackground: { kind: 'default' } }) }
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
  ipcMain.handle('personalOS:appearance:chooseDesktopBackground', () => chooseDesktopBackground())
  ipcMain.handle('personalOS:appearance:resetDesktopBackground', () => resetDesktopBackground())
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
  registerAppearanceAssetProtocol()
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
