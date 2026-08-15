import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HarnessClient } from '@deepseek-ai/dsh-sdk-client'
import { buildDshChildEnv, redactEnvForEvidence } from '../src/runtime-env.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(here, '..')
const configPath = resolve(packageRoot, 'runtime', 'cordis.poc.yml')
const runtimeBin = fileURLToPath(import.meta.resolve('@deepseek-ai/dsh-sdk-jsonrpc-demo/bin'))
const sessionRoot = resolve(tmpdir(), `YrenPersonalOS-DSH-Boot-${Date.now()}`)
await mkdir(sessionRoot, { recursive: true })

const childEnv = buildDshChildEnv({
  credentialKeys: [],
  extra: {
    DSH_SESSION_ROOT: sessionRoot,
  },
})

const client = new HarnessClient({
  command: process.execPath,
  args: [runtimeBin, configPath],
  cwd: packageRoot,
  env: childEnv,
  requestTimeoutMs: 15_000,
  shutdownTimeoutMs: 1_000,
  disposeEofGraceMs: 6_000,
  disposeGraceMs: 3_000,
})

console.log(JSON.stringify({
  phase: 'preflight',
  node: process.version,
  configPath,
  sessionRoot,
  childEnv: redactEnvForEvidence(childEnv, []),
}))

try {
  client.start()
  const initialized = await client.initialize({
    cwd: packageRoot,
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
    maxTokens: 128,
  })
  console.log(JSON.stringify({ phase: 'initialized', initialized: initialized ?? true }))
} finally {
  await client.close()
  console.log(JSON.stringify({ phase: 'closed' }))
}
