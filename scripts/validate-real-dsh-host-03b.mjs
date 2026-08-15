/**
 * Host-side validation runner for the 03B Real DSH Host Binding.
 *
 * Run from ordinary Windows PowerShell (not the Developer Harness sandbox):
 *
 *   node scripts/validate-real-dsh-host-03b.mjs --dsh-root "<DSH_ROOT>"
 *
 * It validates the DSH source identity, confirms dependencies are materialized,
 * then runs the real DSH host integration tests plus the full 03A regression as
 * dedicated Node processes. No API key, no real model provider, no LLM network.
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function parseDshRoot(argv) {
  const idx = argv.indexOf('--dsh-root')
  if (idx === -1 || idx + 1 >= argv.length) return null
  return argv[idx + 1]
}

const dshRoot = parseDshRoot(process.argv.slice(2))
if (!dshRoot) {
  console.error('Usage: node scripts/validate-real-dsh-host-03b.mjs --dsh-root "<DSH_ROOT>"')
  process.exit(2)
}

if (!existsSync(dshRoot)) {
  console.error(`DSH root does not exist: ${dshRoot}`)
  process.exit(2)
}

let version = 'unknown'
try {
  version = JSON.parse(readFileSync(join(dshRoot, 'package.json'), 'utf8')).version
} catch {
  // fall through
}
if (version !== '0.1.0-rc.5') {
  console.error(`DSH version mismatch: expected 0.1.0-rc.5, got ${version}`)
  process.exit(2)
}

if (!existsSync(join(dshRoot, 'node_modules'))) {
  console.error(
    `DSH dependencies not materialized. Run in ${dshRoot}:\n` +
      '  corepack pnpm@11.7.0 install --frozen-lockfile --ignore-scripts',
  )
  process.exit(2)
}

const testFiles = [
  'test/real-dsh-host.integration.test.mjs',
  'test/runtime-dsh-launch-config.test.mjs',
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
    timeout: 300000,
    env: { ...process.env, DSH_ROOT: dshRoot },
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
console.log(`\nAll ${testFiles.length} test files passed (real DSH host + 03A regression).`)
