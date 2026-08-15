import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolveDesktopHostChildEntry } from '../src/infrastructure/runtime/desktop-child-entry.mjs'

// Worktree root from this test file (tests run from the repo root).
const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const CHILD = join(repoRoot, 'src', 'infrastructure', 'runtime', 'real-dsh-host-child.mjs')
const appPath = join(repoRoot, 'apps', 'desktop')
const bundleDir = join(appPath, '.vite', 'build')
const MISSING = 'C:\\missing\\context'

test('dev resolver finds the real source child from the Forge dev app path', () => {
  const entry = resolveDesktopHostChildEntry({ appPath, bundleDir, cwd: appPath })
  assert.equal(entry, CHILD)
  assert.ok(existsSync(entry), 'resolved child entry must exist')
})

test('dev resolver falls back to the bundled Main dir when app path misses', () => {
  const entry = resolveDesktopHostChildEntry({ appPath: MISSING, bundleDir, cwd: MISSING })
  assert.equal(entry, CHILD)
})

test('dev resolver falls back to cwd when app path and bundle dir miss', () => {
  const entry = resolveDesktopHostChildEntry({ appPath: MISSING, bundleDir: MISSING, cwd: appPath })
  assert.equal(entry, CHILD)
})

test('dev resolver returns null when no candidate exists (fail-closed signal)', () => {
  const entry = resolveDesktopHostChildEntry({ appPath: MISSING, bundleDir: MISSING, cwd: MISSING })
  assert.equal(entry, null)
})
