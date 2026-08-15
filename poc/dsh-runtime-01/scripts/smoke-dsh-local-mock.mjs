import assert from 'node:assert/strict'
import { copyFile, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { DeepSeekHarnessAdapter } from '../src/dsh-agent-runtime.mjs'
import { buildDshChildEnv, redactEnvForEvidence } from '../src/runtime-env.mjs'

const DSH_COMMIT = '47f943859bef60e4160492346772ded9b24f765a'
const MOCK_TOKEN = 'personal-os-poc-mock-key'
const EXPECTED_RESPONSE = 'PERSONAL_OS_DSH_MOCK_OK'
const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(here, '..')
const localConfigPath = resolve(packageRoot, 'runtime', 'cordis.poc.yml')
const dshRoot = process.env.DSH_SOURCE_ROOT

if (!dshRoot) throw new Error('DSH_SOURCE_ROOT is required for the source-runtime POC')

const sdkEntry = resolve(dshRoot, 'packages', 'sdk', 'client', 'lib', 'index.js')
const mockEntry = resolve(dshRoot, 'packages', 'test-support', 'llm-mock-server', 'lib', 'index.js')
const runtimeBin = resolve(dshRoot, 'packages', 'examples', 'jsonrpc-demo', 'lib', 'bin.js')
const runtimeProject = resolve(dshRoot, 'examples', 'jsonrpc-agent')
const configPath = resolve(runtimeProject, 'personal-os-poc.cordis.yml')
const sessionRoot = resolve(tmpdir(), `YrenPersonalOS-DSH-Mock-${Date.now()}`)

await mkdir(sessionRoot, { recursive: true })
await copyFile(localConfigPath, configPath)

const sdkModule = await import(pathToFileURL(sdkEntry).href)
const { startMockLlmServer } = await import(pathToFileURL(mockEntry).href)
const mock = await startMockLlmServer({
  host: '127.0.0.1',
  port: 0,
  apiKey: MOCK_TOKEN,
  sequence: ['success'],
  successText: EXPECTED_RESPONSE,
})

const childEnv = buildDshChildEnv({
  credentialKeys: [],
  extra: {
    DSH_SESSION_ROOT: sessionRoot,
    DEEPSEEK_API_KEY: MOCK_TOKEN,
    DEEPSEEK_BASE_URL: `${mock.baseURL}/v1`,
  },
})

const runtime = new DeepSeekHarnessAdapter({
  launch: {
    command: process.execPath,
    args: [runtimeBin, configPath],
    cwd: dshRoot,
    env: childEnv,
    requestTimeoutMs: 15_000,
    shutdownTimeoutMs: 1_000,
    disposeEofGraceMs: 6_000,
    disposeGraceMs: 3_000,
  },
  cwd: packageRoot,
  provider: 'deepseek-official',
  model: 'deepseek-v4-flash',
  maxTokens: 128,
  runtimeVersion: '0.1.0-rc.5',
  runtimeCommit: DSH_COMMIT,
  sdkModule,
})

console.log(JSON.stringify({
  phase: 'preflight',
  node: process.version,
  runtimeCommit: DSH_COMMIT,
  provider: 'deepseek-official',
  model: 'deepseek-v4-flash',
  transport: 'loopback-official-mock',
  mockBaseUrl: mock.baseURL,
  childEnv: redactEnvForEvidence(childEnv, ['DEEPSEEK_API_KEY']),
}))

let unsubscribe = () => {}
try {
  const { sessionId } = await runtime.createSession()
  const events = []
  unsubscribe = runtime.subscribe(sessionId, event => {
    events.push(event)
  })

  const result = await runtime.prompt(sessionId, {
    text: 'Reply with exactly: PERSONAL_OS_DSH_MOCK_OK',
  })

  const sessionEventTypes = events
    .filter(event => event.type === 'runtime-event')
    .map(event => event.event?.type)
    .filter(type => typeof type === 'string')
  const runtimeStates = events
    .filter(event => event.type === 'runtime-status')
    .map(event => event.state)

  assert.equal(result.accepted, true)
  assert.equal(result.completed, true)
  assert.equal(result.sessionId, sessionId)
  assert.equal(result.finalResponse, EXPECTED_RESPONSE)
  assert.ok(sessionEventTypes.includes('user/message'), 'missing user/message session event')
  assert.ok(sessionEventTypes.includes('assistant/message'), 'missing assistant/message session event')
  assert.ok(sessionEventTypes.includes('turn/start'), 'missing turn/start session event')
  assert.ok(sessionEventTypes.includes('turn/end'), 'missing turn/end session event')
  assert.ok(runtimeStates.includes('running'), 'missing running runtime state')
  assert.ok(runtimeStates.includes('idle'), 'missing idle runtime state')
  assert.equal(mock.requests.length, 1, 'expected exactly one local mock provider request')
  assert.equal(mock.requests[0]?.behavior, 'success')
  assert.equal(mock.requests[0]?.outcome, 'completed')

  console.log(JSON.stringify({
    phase: 'round-trip-pass',
    sessionId,
    accepted: result.accepted,
    completed: result.completed,
    finalResponse: result.finalResponse,
    sessionEventTypes,
    runtimeStates,
    mockRequest: {
      path: mock.requests[0]?.path,
      behavior: mock.requests[0]?.behavior,
      outcome: mock.requests[0]?.outcome,
    },
  }))
} finally {
  unsubscribe()
  await runtime.close()
  await mock.close()
  await rm(configPath, { force: true })
  await rm(sessionRoot, { recursive: true, force: true })
  console.log(JSON.stringify({ phase: 'closed' }))
}
