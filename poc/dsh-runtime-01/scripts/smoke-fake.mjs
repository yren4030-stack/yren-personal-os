import { FakeAgentRuntime } from '../src/fake-agent-runtime.mjs'

const runtime = new FakeAgentRuntime()
try {
  const { sessionId } = await runtime.createSession()
  runtime.subscribe(sessionId, event => {
    console.log(JSON.stringify({ source: 'fake-runtime', event }))
  })
  const result = await runtime.prompt(sessionId, { text: 'hello' })
  console.log(JSON.stringify({ source: 'fake-runtime', result }))
} finally {
  await runtime.close()
}
