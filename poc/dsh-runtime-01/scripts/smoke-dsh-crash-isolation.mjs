import { copyFile, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildDshChildEnv, redactEnvForEvidence } from '../src/runtime-env.mjs'

const DSH_COMMIT = '47f943859bef60e4160492346772ded9b24f765a'
const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(here, '..')
const localConfigPath = resolve(packageRoot, 'runtime', 'cordis.poc.yml')
const dshRoot = process.env.DSH_SOURCE_ROOT

if (!dshRoot) throw new Error('DSH_SOURCE_ROOT is required for the crash-isolation POC')

const sdkEntry = resolve(dshRoot, 'packages', 'sdk', 'client', 'lib', 'index.js')
const runtimeBin = resolve(dshRoot, 'packages', 'examples', 'jsonrpc-demo', 'lib', 'bin.js')
const runtimeProject = resolve(dshRoot, 'examples', 'jsonrpc-agent')
const configPath = resolve(runtimeProject, `.personal-os-poc-crash-${process.pid}-${Date.now()}.cordis.yml`)
const sessionRoot = resolve(tmpdir(), `YrenPersonalOS-DSH-Crash-${process.pid}-${Date.now()}`)

await mkdir(sessionRoot, { recursive: true })
await copyFile(localConfigPath, configPath)

const { HarnessClient, TransportClosedError } = await import(pathToFileURL(sdkEntry).href)
const childEnv = buildDshChildEnv({
  credentialKeys: [],
  extra: { DSH_SESSION_ROOT: sessionRoot },
})

const client = new HarnessClient({
  command: process.execPath,
  args: [runtimeBin, configPath],
  cwd: dshRoot,
  env: childEnv,
  requestTimeoutMs: 5_000,
  shutdownTimeoutMs: 500,
  disposeEofGraceMs: 500,
  disposeGraceMs: 500,
})

console.log(JSON.stringify({
  phase: 'preflight',
  node: process.version,
  runtimeCommit: DSH_COMMIT,
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
  console.log(JSON.stringify({ phase: 'initialized', initialized }))

  // POC-only white-box access. `child` is private in the SDK TypeScript API and
  // MUST NOT be copied into Personal OS production contracts. We use it only
  // to force a real Windows subprocess death and validate fault containment.
  const child = client.child
  if (!child || typeof child.kill !== 'function') {
    throw new Error('POC could not access the SDK-owned child process for forced-crash validation')
  }

  const pid = child.pid
  if (!pid) throw new Error('DSH child PID was unavailable after initialize')

  const killed = child.kill('SIGKILL')
  console.log(JSON.stringify({ phase: 'forced-kill', pid, killAccepted: killed }))

  const exit = await new Promise((resolveExit, reject) => {
    const timer = setTimeout(() => reject(new Error('DSH child did not exit after forced kill')), 5_000)
    child.once('exit', (code, signal) => {
      clearTimeout(timer)
      resolveExit({ code, signal })
    })
  })
  console.log(JSON.stringify({ phase: 'child-exited', ...exit }))

  let observedTransportFailure = false
  try {
    await client.request('initialize', {
      cwd: packageRoot,
      provider: 'deepseek-official',
      model: 'deepseek-v4-flash',
      maxTokens: 128,
    }, 2_000)
  } catch (error) {
    if (!(error instanceof TransportClosedError)) throw error
    observedTransportFailure = true
    console.log(JSON.stringify({
      phase: 'transport-contained',
      errorName: error.name,
      parentAlive: true,
    }))
  }

  if (!observedTransportFailure) {
    throw new Error('Expected TransportClosedError after forced DSH child death')
  }

  await client.close()
  console.log(JSON.stringify({ phase: 'close-after-crash-complete' }))
  console.log(JSON.stringify({ phase: 'crash-isolation-pass', parentAlive: true }))
} finally {
  await client.close().catch(() => {})
  await rm(configPath, { force: true })
}
