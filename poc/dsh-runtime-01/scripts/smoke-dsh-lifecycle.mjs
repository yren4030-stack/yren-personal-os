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

if (!dshRoot) throw new Error('DSH_SOURCE_ROOT is required for the lifecycle POC')

const sdkEntry = resolve(dshRoot, 'packages', 'sdk', 'client', 'lib', 'index.js')
const runtimeBin = resolve(dshRoot, 'packages', 'examples', 'jsonrpc-demo', 'lib', 'bin.js')
const runtimeProject = resolve(dshRoot, 'examples', 'jsonrpc-agent')
const configPath = resolve(
  runtimeProject,
  `.personal-os-poc-lifecycle-${process.pid}-${Date.now()}.cordis.yml`,
)

await copyFile(localConfigPath, configPath)
const { HarnessClient } = await import(pathToFileURL(sdkEntry).href)

console.log(JSON.stringify({
  phase: 'preflight',
  node: process.version,
  runtimeCommit: DSH_COMMIT,
  cycles: 2,
  dshRoot,
}))

try {
  for (let cycle = 1; cycle <= 2; cycle += 1) {
    const sessionRoot = resolve(
      tmpdir(),
      `YrenPersonalOS-DSH-Lifecycle-${process.pid}-${Date.now()}-${cycle}`,
    )
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
      cwd: dshRoot,
      env: childEnv,
      requestTimeoutMs: 15_000,
      shutdownTimeoutMs: 1_000,
      disposeEofGraceMs: 6_000,
      disposeGraceMs: 3_000,
    })

    console.log(JSON.stringify({
      phase: 'cycle-start',
      cycle,
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
      console.log(JSON.stringify({
        phase: 'initialized',
        cycle,
        initialized: initialized ?? true,
      }))
    } finally {
      await client.close()
      console.log(JSON.stringify({ phase: 'closed', cycle }))
    }
  }

  console.log(JSON.stringify({ phase: 'lifecycle-pass', cycles: 2 }))
} finally {
  await rm(configPath, { force: true })
}
