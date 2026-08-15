import test from 'node:test'
import assert from 'node:assert/strict'
import { DeepSeekHarnessAdapter } from '../src/dsh-agent-runtime.mjs'
import { RuntimeState } from '../src/runtime-contract.mjs'
import { buildDshChildEnv, redactEnvForEvidence } from '../src/runtime-env.mjs'

class FakeHarness {
  constructor(options) {
    this.options = options
    this.closed = false
  }

  async run(text, { sessionId, onNotification } = {}) {
    onNotification?.({
      method: 'session.status',
      params: { sessionId, status: 'running' },
    })
    onNotification?.({
      method: 'session.event',
      params: {
        sessionId,
        event: { type: 'assistant/message', data: { hidden: 'must-not-leak' } },
      },
    })
    onNotification?.({
      method: 'session.status',
      params: { sessionId, status: 'idle' },
    })
    return {
      sessionId,
      finalResponse: `dsh:${text}`,
      events: [],
      notifications: [],
    }
  }

  async close() {
    this.closed = true
  }
}

test('DSH adapter exposes runtime-neutral session/run/event shapes', async () => {
  const runtime = new DeepSeekHarnessAdapter({
    launch: { command: 'node', args: ['runtime.js'] },
    sdkModule: { DeepSeekHarness: FakeHarness },
    runtimeVersion: '0.1.0-rc.5',
    runtimeCommit: '47f943859bef60e4160492346772ded9b24f765a',
    provider: 'deepseek-official',
    model: 'deepseek-v4-flash',
  })

  const session = await runtime.createSession({ sessionId: 'pos-test-session' })
  assert.equal(session.sessionId, 'pos-test-session')
  assert.equal(session.adapter, 'deepseek-harness')

  const events = []
  const unsubscribe = runtime.subscribe(session.sessionId, event => events.push(event))
  const result = await runtime.prompt(session.sessionId, { text: 'hello' })

  assert.equal(result.sessionId, session.sessionId)
  assert.equal(result.completed, true)
  assert.equal(result.finalResponse, 'dsh:hello')
  assert.match(result.runId, /^pos-run-/)
  assert.ok(events.some(event => event.type === 'runtime-event'))
  assert.equal(events.find(event => event.type === 'runtime-event')?.event?.type, 'assistant/message')
  assert.equal(events.find(event => event.type === 'runtime-event')?.event?.data, undefined)

  const status = await runtime.getRuntimeStatus()
  assert.equal(status.state, RuntimeState.IDLE)
  assert.equal(status.runtimeVersion, '0.1.0-rc.5')

  unsubscribe()
  await runtime.close()
  assert.equal((await runtime.getRuntimeStatus()).state, RuntimeState.CLOSED)
})

test('DSH adapter maps transport loss to neutral error', async () => {
  class BrokenHarness extends FakeHarness {
    async run() {
      const error = new Error('child exited')
      error.name = 'TransportClosedError'
      throw error
    }
  }

  const runtime = new DeepSeekHarnessAdapter({
    launch: { command: 'node' },
    sdkModule: { DeepSeekHarness: BrokenHarness },
  })
  const { sessionId } = await runtime.createSession()

  await assert.rejects(
    runtime.prompt(sessionId, 'hello'),
    error => error?.code === 'runtime-transport-lost',
  )
  assert.equal((await runtime.getRuntimeStatus()).state, RuntimeState.UNAVAILABLE)
  await runtime.close()
})

test('child env is allowlisted and evidence redacts credentials', () => {
  const parentEnv = {
    SystemRoot: 'C:\\Windows',
    TEMP: 'C:\\Temp',
    PATH: 'C:\\Node',
    DEEPSEEK_API_KEY: 'secret-value',
    UNRELATED_PRIVATE_SECRET: 'must-not-pass',
  }

  const env = buildDshChildEnv({
    parentEnv,
    credentialKeys: ['DEEPSEEK_API_KEY'],
    extra: { DSH_SESSION_ROOT: 'C:\\Temp\\pos-dsh-session' },
  })

  assert.equal(env.UNRELATED_PRIVATE_SECRET, undefined)
  assert.equal(env.DEEPSEEK_API_KEY, 'secret-value')
  assert.equal(env.DSH_SESSION_ROOT, 'C:\\Temp\\pos-dsh-session')

  const evidence = redactEnvForEvidence(env, ['DEEPSEEK_API_KEY'])
  assert.equal(evidence.DEEPSEEK_API_KEY, '<redacted>')
})
