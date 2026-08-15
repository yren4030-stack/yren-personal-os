/**
 * Test infrastructure that starts the frozen DSH official mock LLM server
 * (127.0.0.1 only) through tsx, exposes its baseURL + captured request
 * telemetry, and closes it. This is NOT part of the Personal OS production
 * composition.
 */
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

export async function startDshMockServer({ dshRoot, successText, sequence = ['success'], apiKey = 'mock-key' }) {
  const url = pathToFileURL(join(dshRoot, 'packages', 'test-support', 'llm-mock-server', 'src', 'index.ts')).href
  const { startMockLlmServer } = await import(url)
  const server = await startMockLlmServer({
    host: '127.0.0.1',
    port: 0,
    apiKey,
    sequence,
    ...(successText === undefined ? {} : { successText }),
  })
  return {
    baseURL: server.baseURL,
    requests: server.requests,
    close: () => server.close(),
  }
}
