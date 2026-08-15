import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DeepSeekHarnessAdapter } from '../src/dsh-agent-runtime.mjs'
import { buildDshChildEnv, redactEnvForEvidence } from '../src/runtime-env.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(here, '..')
const configPath = resolve(packageRoot, 'runtime', 'cordis.poc.yml')
const runtimeBin = fileURLToPath(import.meta.resolve('@deepseek-ai/dsh-sdk-jsonrpc-demo/bin'))
const sessionRoot = resolve(tmpdir(), `YrenPersonalOS-DSH-POC-${Date.now()}`)
await mkdir(sessionRoot, { recursive: true })

const credentialKeys = ['DEEPSEEK_API_KEY']
const childEnv = buildDshChildEnv({
  credentialKeys,
  extra: {
    DSH_SESSION_ROOT: sessionRoot,
  },
})

const runtime = new DeepSeekHarnessAdapter({
  launch: {
    command: process.execPath,
    args: [runtimeBin, configPath],
    cwd: packageRoot,
    env: childEnv,
    shutdownTimeoutMs: 1_000,
    disposeEofGraceMs: 6_000,
    disposeGraceMs: 3_000,
  },
  cwd: packageRoot,
  provider: process.env.POS_DSH_PROVIDER ?? 'deepseek-official',
  model: process.env.POS_DSH_MODEL ?? 'deepseek-v4-flash',
  maxTokens: Number(process.env.POS_DSH_MAX_TOKENS ?? 512),
  runtimeVersion: '0.1.0-rc.5',
  runtimeCommit: '47f943859bef60e4160492346772ded9b24f765a',
})

console.log(JSON.stringify({
  phase: 'preflight',
  node: process.version,
  runtimeVersion: '0.1.0-rc.5',
  runtimeCommit: '47f943859bef60e4160492346772ded9b24f765a',
  configPath,
  sessionRoot,
  childEnv: redactEnvForEvidence(childEnv, credentialKeys),
}))

try {
  const { sessionId } = await runtime.createSession()
  const eventTypes = []
  const unsubscribe = runtime.subscribe(sessionId, event => {
    eventTypes.push(event.type)
    console.log(JSON.stringify({ phase: 'event', event }))
  })

  try {
    const result = await runtime.prompt(sessionId, {
      text: 'Reply with exactly: PERSONAL_OS_DSH_RUNTIME_OK',
    })
    console.log(JSON.stringify({ phase: 'result', result, eventTypes }))
  } finally {
    unsubscribe()
  }
} finally {
  await runtime.close()
  console.log(JSON.stringify({ phase: 'closed', status: await runtime.getRuntimeStatus() }))
}
