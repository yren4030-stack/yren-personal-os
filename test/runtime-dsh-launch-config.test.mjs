import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  createDeepSeekHarnessLaunchConfig,
  resolveRealDshHostChildEntry,
} from '../src/infrastructure/runtime/dsh-launch-config.mjs'

test('resolveRealDshHostChildEntry returns an existing file path', () => {
  const entry = resolveRealDshHostChildEntry()
  assert.equal(typeof entry, 'string')
  assert.ok(existsSync(entry))
})

test('createDeepSeekHarnessLaunchConfig requires a dshRoot string', () => {
  assert.throws(() => createDeepSeekHarnessLaunchConfig({}), TypeError)
  assert.throws(() => createDeepSeekHarnessLaunchConfig({ dshRoot: 123 }), TypeError)
})

test('launch config launches the child via tsx with cwd = dshRoot and DSH_ROOT env', () => {
  const dshRoot = 'C:\\example\\deepseek-harness'
  const config = createDeepSeekHarnessLaunchConfig({ dshRoot, executable: 'C:\\node.exe' })

  assert.equal(config.executable, 'C:\\node.exe')
  assert.deepEqual(config.args, ['--import', 'tsx/esm', resolveRealDshHostChildEntry()])
  assert.equal(config.cwd, dshRoot)
  assert.equal(config.env.DSH_ROOT, dshRoot)
})

test('launch config env is whitelisted (no secrets, no full process.env)', () => {
  const config = createDeepSeekHarnessLaunchConfig({ dshRoot: 'C:\\example\\dsr' })
  const env = config.env
  // DSH_ROOT is the only runtime locator added; standard secrets are absent.
  assert.equal(env.DSH_ROOT, 'C:\\example\\dsr')
  assert.equal('DEEPSEEK_API_KEY' in env, false)
  assert.equal('OPENAI_API_KEY' in env, false)
  assert.equal('GITHUB_TOKEN' in env, false)
  assert.equal('NPM_TOKEN' in env, false)
  // The whitelist includes the standard Windows/Node minimum, not everything.
  assert.ok('PATH' in env || 'SYSTEMROOT' in env || 'TEMP' in env || 'TMP' in env)
})

test('launch config does not hardcode the DSH root path', () => {
  // The child entry path is derived from this module's own location, never from
  // a fixed machine path; dshRoot is always caller-supplied.
  const entry = resolveRealDshHostChildEntry()
  assert.equal(entry.includes('real-dsh-host-child.mjs'), true)
  assert.equal(entry.includes('deepseek-harness-47f9438-source'), false)
})

test('inside Electron the child runs as plain Node (ELECTRON_RUN_AS_NODE=1)', () => {
  // In Electron main, process.execPath is electron.exe, not node.exe. Without
  // ELECTRON_RUN_AS_NODE the bridge would spawn a second Electron app that
  // never emits the ready handshake (the 04A startup-timeout root cause).
  const config = createDeepSeekHarnessLaunchConfig({
    dshRoot: 'C:\\example\\deepseek-harness',
    executable: 'C:\\electron.exe',
    isElectron: true,
  })

  assert.equal(config.env.ELECTRON_RUN_AS_NODE, '1')
  assert.equal(config.env.DSH_ROOT, 'C:\\example\\deepseek-harness')
  assert.deepEqual(config.args, ['--import', 'tsx/esm', resolveRealDshHostChildEntry()])
  assert.equal(config.cwd, 'C:\\example\\deepseek-harness')
})

test('outside Electron no ELECTRON_RUN_AS_NODE is injected', () => {
  // Plain Node (Harness tests, 03C validator) spawns node.exe directly.
  const config = createDeepSeekHarnessLaunchConfig({
    dshRoot: 'C:\\example\\deepseek-harness',
    executable: 'C:\\node.exe',
    isElectron: false,
  })
  assert.equal('ELECTRON_RUN_AS_NODE' in config.env, false)
})

test('Electron detection is automatic from process.versions (no injection needed)', () => {
  const detected = Boolean(process.versions && process.versions.electron)
  const config = createDeepSeekHarnessLaunchConfig({ dshRoot: 'C:\\example\\deepseek-harness' })
  assert.equal('ELECTRON_RUN_AS_NODE' in config.env, detected)
})

test('explicit hostChildEntry overrides the source-sibling default and is preserved exactly in bridge args', () => {
  // An existing file different from the default child entry proves the
  // explicit value wins and is forwarded verbatim.
  const explicit = fileURLToPath(new URL('../src/infrastructure/runtime/dsh-launch-config.mjs', import.meta.url))
  assert.ok(existsSync(explicit))
  assert.notEqual(explicit, resolveRealDshHostChildEntry())

  const config = createDeepSeekHarnessLaunchConfig({
    dshRoot: 'C:\\example\\deepseek-harness',
    executable: 'C:\\node.exe',
    hostChildEntry: explicit,
  })
  assert.equal(config.args[2], explicit)
})

test('missing explicit hostChildEntry fails closed before spawn (CHILD_ENTRY_MISSING)', () => {
  assert.throws(
    () => createDeepSeekHarnessLaunchConfig({ dshRoot: 'C:\\example\\deepseek-harness', hostChildEntry: 'C:\\missing\\real-dsh-host-child.mjs' }),
    (error) => error && error.code === 'CHILD_ENTRY_MISSING',
  )
})
