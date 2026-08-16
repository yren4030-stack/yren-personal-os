/**
 * Test infrastructure that starts the frozen DSH official mock LLM server
 * (127.0.0.1 only) through tsx, exposes its baseURL + captured request
 * telemetry, and closes it. This is NOT part of the Personal OS production
 * composition.
 *
 * The official mock consumes ONE scripted behavior per accepted request and
 * answers `MOCK_SCRIPT_EXHAUSTED` (HTTP 500) after the sequence runs out,
 * unless `repeatLast: true` reuses the final behavior forever. Desktop
 * validation sessions pass repeatLast: true so one mock instance supports
 * repeated independent agent turns.
 */
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

export async function startDshMockServer({ dshRoot, successText, sequence = ['success'], repeatLast = false, apiKey = 'mock-key' }) {
  const url = pathToFileURL(join(dshRoot, 'packages', 'test-support', 'llm-mock-server', 'src', 'index.ts')).href
  const { startMockLlmServer } = await import(url)
  const server = await startMockLlmServer({
    host: '127.0.0.1',
    port: 0,
    apiKey,
    sequence,
    repeatLast,
    ...(successText === undefined ? {} : { successText }),
  })
  return {
    baseURL: server.baseURL,
    requests: server.requests,
    close: () => server.close(),
  }
}
