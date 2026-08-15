/**
 * Host-side validation runner for 03C Real DSH Agent Turn Binding.
 *
 * Run from ordinary Windows PowerShell (not the Developer Harness sandbox):
 *
 *   node scripts/validate-real-dsh-agent-turn-03c.mjs --dsh-root "<DSH_ROOT>"
 *
 * It verifies the frozen DSH source identity, then runs the real DSH agent-turn
 * integration (under tsx, because the official mock LLM is TypeScript source),
 * the 03B real-host regression, and the full 03A/application/SQLite/composition
 * regression. No API key, no real model provider, no LLM network beyond 127.0.0.1.
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
  console.error('Usage: node scripts/validate-real-dsh-agent-turn-03c.mjs --dsh-root "<DSH_ROOT>"')
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
const sha = spawnSync('git', ['-C', dshRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim()
if (sha !== '47f943859bef60e4160492346772ded9b24f765a') {
  console.error(`DSH SHA mismatch: expected 47f9438..., got ${sha}`)
  process.exit(2)
}
if (!existsSync(join(dshRoot, 'node_modules'))) {
  console.error(`DSH dependencies not materialized. Run in ${dshRoot}: corepack pnpm@11.7.0 install --frozen-lockfile --ignore-scripts`)
  process.exit(2)
}

function runOne(args, opts) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', timeout: 300000, ...opts })
  return result.status === 0
}

let failed = 0
const plainTests = [
  'test/real-dsh-agent-turn.integration.test.mjs', // run first, under tsx
  'test/real-dsh-host.integration.test.mjs',
  'test/runtime-dsh-launch-config.test.mjs',
  'test/proposal-protocol.test.mjs',
  'test/runtime-protocol.test.mjs',
  'test/runtime-bridge.test.mjs',
  'test/runtime-product-loop.integration.test.mjs',
  'test/project-read-propose-loop.test.mjs',
  'test/sqlite-persistence.test.mjs',
  'test/composition.integration.test.mjs',
]

for (const file of plainTests) {
  process.stdout.write(`\n===== ${file} =====\n`)
  const isTsx = file === 'test/real-dsh-agent-turn.integration.test.mjs'
  const args = isTsx
    ? ['--import', 'tsx/esm', join(repoRoot, file)]
    : [join(repoRoot, file)]
  const ok = runOne(args, {
    cwd: isTsx ? dshRoot : repoRoot,
    env: { ...process.env, DSH_ROOT: dshRoot },
  })
  if (!ok) {
    failed += 1
    process.stdout.write(`>>> FAILED\n`)
  }
}

if (failed > 0) {
  console.error(`\n${failed} of ${plainTests.length} test files failed.`)
  process.exit(1)
}
console.log(`\nAll ${plainTests.length} test files passed (03C agent turn + 03B/03A + regression).`)
