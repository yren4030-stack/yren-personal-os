import test from 'node:test'
import assert from 'node:assert/strict'
import { FakeAgentRuntime } from '../src/fake-agent-runtime.mjs'
import { RuntimeState, assertAgentRuntimePort } from '../src/runtime-contract.mjs'

test('fake runtime satisfies AgentRuntimePort', () => {
  const runtime = new FakeAgentRuntime()
  assert.equal(assertAgentRuntimePort(runtime), runtime)
})

test('fake runtime supports session, prompt, events, and close', async () => {
  const runtime = new FakeAgentRuntime()
  const { sessionId } = await runtime.createSession()
  const events = []
  const unsubscribe = runtime.subscribe(sessionId, event => events.push(event))

  const receipt = await runtime.prompt(sessionId, { text: 'hello' })
  assert.equal(receipt.accepted, true)
  assert.match(receipt.messageId, /^fake-message-/)
  assert.deepEqual(events.map(event => event.type), [
    'runtime-status',
    'user-message',
    'assistant-message',
    'runtime-status',
  ])

  const statusBeforeClose = await runtime.getRuntimeStatus()
  assert.equal(statusBeforeClose.state, RuntimeState.IDLE)

  unsubscribe()
  await runtime.close()
  const statusAfterClose = await runtime.getRuntimeStatus()
  assert.equal(statusAfterClose.state, RuntimeState.CLOSED)

  await assert.rejects(
    runtime.createSession(),
    error => error?.code === 'runtime-unavailable',
  )
})
