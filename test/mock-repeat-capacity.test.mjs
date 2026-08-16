/**
 * Mock response-capacity proof for the official DSH mock LLM server
 * (frozen DSH source, read-only). Pure in-process: no child spawn.
 * Requires DSH_ROOT env (the frozen DSH source location).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

const dshRoot = process.env.DSH_ROOT
if (!dshRoot) {
  throw new Error('DSH_ROOT env var is required for mock capacity tests')
}

async function startMock(options) {
  const url = pathToFileURL(join(dshRoot, 'packages', 'test-support', 'llm-mock-server', 'src', 'index.ts')).href
  const { startMockLlmServer } = await import(url)
  return startMockLlmServer({ host: '127.0.0.1', port: 0, ...options })
}

async function fire(server) {
  const response = await fetch(`${server.baseURL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'mock', messages: [{ role: 'user', content: 'hi' }] }),
  })
  await response.text()
  return response.status
}

test('MOCK_RESPONSE_CAPACITY: one-shot sequence exhausts on the second request (root cause)', async (t) => {
  const server = await startMock({ sequence: ['success'], successText: '{"title":"A"}' })
  t.after(() => server.close())

  assert.equal(await fire(server), 200)
  assert.equal(await fire(server), 500, 'second request must fail with MOCK_SCRIPT_EXHAUSTED')

  const behaviors = server.requests.map((r) => r.behavior)
  assert.deepEqual(behaviors, ['success', 'script_exhausted'])
  assert.equal(server.requests[1].scriptBehavior, 'script_exhausted')
})

test('repeatLast: true keeps serving the final behavior for repeated requests (validation fix)', async (t) => {
  const server = await startMock({ sequence: ['success'], repeatLast: true, successText: '{"title":"B"}' })
  t.after(() => server.close())

  assert.equal(await fire(server), 200)
  assert.equal(await fire(server), 200)
  assert.equal(await fire(server), 200)

  const behaviors = server.requests.map((r) => r.behavior)
  assert.deepEqual(behaviors, ['success', 'success', 'success'])
})
