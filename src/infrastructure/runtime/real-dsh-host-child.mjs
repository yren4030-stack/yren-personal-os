/**
 * Real DSH Host child — a dedicated process that boots the frozen DSH source
 * (Cordis Context + SessionStore + SystemPrompt + UserQuestionService +
 * AgentRegistry + ApprovalService + createApiProxy) and bridges its ApiProxy
 * event mux to the Personal OS stdio JSON-lines protocol.
 *
 * 03C extension: when POS_DSH_MOCK_BASE_URL is supplied, it additionally boots
 * the real DSH LLM runtime + DeepSeek adapter + Agent Loop, and exposes
 * `agent-turn`, which drives a REAL DSH agent turn through the LOCAL mock LLM.
 * No real model provider is ever called.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { randomUUID } from 'node:crypto'
import readline from 'node:readline'
import { encodeMessage, decodeMessage } from './protocol.mjs'
import { extractAssistantText, AGENT_TURN_FAILED, AGENT_OUTPUT_MISSING } from './assistant-text.mjs'

const dshRoot = process.env.DSH_ROOT
if (!dshRoot) {
  process.stderr.write('real-dsh-host-child: DSH_ROOT is required\n')
  process.exit(1)
}

const MODEL_ID = 'personal-os-03c-mock'
const mockBaseURL = process.env.POS_DSH_MOCK_BASE_URL

const send = (message) => process.stdout.write(encodeMessage(message))
const dshUrl = (rel) => pathToFileURL(join(dshRoot, rel)).href

function readDshVersion() {
  try {
    return JSON.parse(readFileSync(join(dshRoot, 'package.json'), 'utf8')).version
  } catch {
    return 'unknown'
  }
}

async function main() {
  const dshVersion = readDshVersion()

  const { Context } = await import(dshUrl('vendor/cordis/src/index.ts'))
  const sessionMod = await import(dshUrl('packages/core/session/src/index.ts'))
  const { default: SystemPrompt } = await import(dshUrl('packages/core/system-prompt/src/index.ts'))
  const { default: UserQuestionService } = await import(dshUrl('packages/interaction/user-questions/src/index.ts'))
  const { default: AgentRegistry } = await import(dshUrl('packages/core/agent/src/index.ts'))
  const { default: ApprovalService } = await import(dshUrl('packages/interaction/user-approval/src/index.ts'))
  const { createApiProxy, RpcId } = await import(dshUrl('packages/host/apiproxy/src/index.ts'))

  const SessionStore = sessionMod.default
  const SessionId = sessionMod.SessionId

  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(SystemPrompt, { persona: '' })
  await ctx.plugin(UserQuestionService)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(ApprovalService)

  // 03C: wire the real DSH LLM seam only when a LOCAL mock base URL is supplied.
  let agentLoopReady = false
  if (mockBaseURL) {
    const { default: ToolRuntime } = await import(dshUrl('packages/core/tools/src/index.ts'))
    const { default: LlmRuntime } = await import(dshUrl('packages/llm/llm/src/index.ts'))
    const llmDeepSeek = await import(dshUrl('packages/llm/llm-deepseek/src/index.ts'))
    const { default: AgentLoop } = await import(dshUrl('packages/core/agent-loop/src/index.ts'))

    await ctx.plugin(ToolRuntime)
    await ctx.plugin(LlmRuntime)
    await ctx.plugin(llmDeepSeek, {
      baseURL: `${mockBaseURL}/v1`,
      apiKeyEnv: 'POS_DSH_TEST_API_KEY',
      thinking: 'disabled',
      models: [{ id: MODEL_ID, name: 'Personal OS 03C Mock', contextWindow: 1000000 }],
    })
    await ctx.plugin(AgentLoop)
    agentLoopReady = true
  }

  const api = createApiProxy(ctx, {
    defaultModelSelection: () => ({ provider: 'personal-os-03b-probe', model: 'no-model' }),
    cwd: dshRoot,
  })

  const muxAbort = new AbortController()
  const muxRpcId = RpcId('personal-os-03b-mux')
  void (async () => {
    for await (const envelope of api.events.mux({ rpcId: muxRpcId, payload: {} }, muxAbort.signal)) {
      send({ type: 'event', event: 'dsh-host-frame', payload: { rpcId: envelope.rpcId, frame: envelope.payload } })
    }
  })()

  async function runAgentTurn(instruction) {
    if (!agentLoopReady) {
      const error = new Error('agent loop is not configured: POS_DSH_MOCK_BASE_URL is missing')
      error.code = AGENT_TURN_FAILED
      throw error
    }
    const sessionId = SessionId(`personal-os-03c-${randomUUID()}`)
    const handle = await ctx.agents.create({
      sessionId,
      agentOptions: { provider: 'deepseek-official', model: MODEL_ID },
    })
    try {
      const baselineSeq = handle.agent.session.seq
      handle.agent.followup({
        content: [{ type: 'text', text: instruction }],
        source: { kind: 'user' },
      })
      await handle.agent.whenIdle()
      const extracted = extractAssistantText(handle.agent.session.events, baselineSeq)
      if (!extracted.ok) {
        const error = new Error(extracted.code === AGENT_TURN_FAILED ? 'agent turn failed' : 'agent turn produced no assistant text')
        error.code = extracted.code
        throw error
      }
      return { text: extracted.text, sessionId: String(handle.agent.session.id) }
    } finally {
      await handle.dispose()
    }
  }

  send({ type: 'event', event: 'ready', payload: { pid: process.pid, dshVersion, modelRuntimeConfigured: agentLoopReady } })

  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity })
  rl.on('line', (line) => {
    let message
    try {
      message = decodeMessage(line)
    } catch {
      return
    }
    if (!message || message.type !== 'request') return
    void handleRequest(message)
  })

  async function handleRequest(message) {
    switch (message.method) {
      case 'ping': {
        send({ type: 'response', id: message.id, ok: true, result: { pong: true } })
        break
      }
      case 'dsh-host-info': {
        send({
          type: 'response',
          id: message.id,
          ok: true,
          result: {
            host: 'real-dsh-apiproxy',
            dshVersion,
            transport: 'stdio-json-lines',
            networkPortRequired: false,
            httpServerRequired: false,
            modelRuntimeConfigured: agentLoopReady,
          },
        })
        break
      }
      case 'agent-turn': {
        const params = message.params || {}
        const instruction = typeof params.instruction === 'string' ? params.instruction : ''
        try {
          const { text, sessionId } = await runAgentTurn(instruction)
          send({ type: 'response', id: message.id, ok: true, result: { text, sessionId } })
        } catch (error) {
          send({
            type: 'response',
            id: message.id,
            ok: false,
            error: { code: (error && error.code) || 'AGENT_TURN_ERROR', message: error instanceof Error ? error.message : String(error) },
          })
        }
        break
      }
      case 'approval-start': {
        const params = message.params || {}
        const toolName = typeof params.toolName === 'string' ? params.toolName : 'personal-os-03b-probe'
        const reason = typeof params.reason === 'string' ? params.reason : 'Personal OS Real DSH Host Binding 03B'
        const session = ctx.sessions.create()
        session.append('turn/start', { turn: 1 })
        const agent = { session }
        const asked = ctx.approval.request({ agent, toolName, reason })
        void asked.then(
          () => {},
          (error) => {
            process.stderr.write(`approval request failed: ${error && error.message ? error.message : error}\n`)
          },
        )
        send({ type: 'response', id: message.id, ok: true, result: { sessionId: session.id } })
        break
      }
      case 'client-response': {
        const params = message.params || {}
        let receipt
        try {
          receipt = await api.respond({
            type: 'client-response',
            rpcId: params.rpcId,
            result: {
              ok: true,
              value: {
                sessionId: params.sessionId,
                approvalId: params.approvalId,
                outcome: params.outcome,
              },
            },
          })
        } catch (error) {
          send({
            type: 'response',
            id: message.id,
            ok: false,
            error: { code: 'CLIENT_RESPONSE_ERROR', message: error instanceof Error ? error.message : String(error) },
          })
          return
        }
        send({ type: 'response', id: message.id, ok: true, result: receipt })
        break
      }
      case 'crash': {
        process.exit(9)
        break
      }
      case 'shutdown': {
        muxAbort.abort()
        send({ type: 'response', id: message.id, ok: true, result: { bye: true } })
        process.exit(0)
        break
      }
      default: {
        send({
          type: 'response',
          id: message.id,
          ok: false,
          error: { code: 'UNKNOWN_METHOD', message: `unknown method: ${message.method}` },
        })
      }
    }
  }
}

main().catch((error) => {
  process.stderr.write(`real-dsh-host-child fatal: ${error && error.stack ? error.stack : String(error)}\n`)
  process.exit(1)
})
