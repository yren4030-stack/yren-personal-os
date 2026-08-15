import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'

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
