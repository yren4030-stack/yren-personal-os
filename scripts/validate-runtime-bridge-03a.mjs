/**
 * Host-side validation runner for the 03A Runtime Bridge.
 *
 * Run from an ordinary Windows PowerShell (not the Developer Harness sandbox):
 *
 *   node scripts/validate-runtime-bridge-03a.mjs
 *
 * It executes every 03A runtime test file plus the existing regression suites
 * as dedicated Node processes with inherited stdio, and exits non-zero on any
 * failure. No network, no API key, no third-party IPC package.
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

const testFiles = [
  'test/runtime-protocol.test.mjs',
  'test/runtime-bridge.test.mjs',
  'test/runtime-product-loop.integration.test.mjs',
  'test/project-read-propose-loop.test.mjs',
  'test/sqlite-persistence.test.mjs',
  'test/composition.integration.test.mjs',
]

let failed = 0
for (const file of testFiles) {
  process.stdout.write(`\n===== ${file} =====\n`)
  const result = spawnSync(process.execPath, [join(repoRoot, file)], {
    cwd: repoRoot,
    stdio: 'inherit',
    timeout: 120000,
  })
  if (result.status !== 0) {
    failed += 1
    process.stdout.write(`>>> FAILED (exit ${result.status ?? result.error?.code})\n`)
  }
}

if (failed > 0) {
  console.error(`\n${failed} of ${testFiles.length} test files failed.`)
  process.exit(1)
}
console.log(`\nAll ${testFiles.length} test files passed (03A runtime bridge + regression).`)
