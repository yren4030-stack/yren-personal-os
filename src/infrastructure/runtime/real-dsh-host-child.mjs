/**
 * Real DSH Host child — a dedicated process that boots the frozen DSH source
 * (Cordis Context + SessionStore + SystemPrompt + UserQuestionService +
 * AgentRegistry + ApprovalService + createApiProxy) and bridges its ApiProxy
 * event mux to the Personal OS stdio JSON-lines protocol.
 *
 * This is NOT the fixture child. It loads the real frozen DSH TypeScript source
 * (source plane, via tsx) from the caller-supplied DSH_ROOT. It never calls a
 * real model provider and never performs a real LLM request.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import readline from 'node:readline'
import { encodeMessage, decodeMessage } from './protocol.mjs'

const dshRoot = process.env.DSH_ROOT
if (!dshRoot) {
  process.stderr.write('real-dsh-host-child: DSH_ROOT is required\n')
  process.exit(1)
}

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
  const { default: SessionStore } = await import(dshUrl('packages/core/session/src/index.ts'))
  const { default: SystemPrompt } = await import(dshUrl('packages/core/system-prompt/src/index.ts'))
  const { default: UserQuestionService } = await import(dshUrl('packages/interaction/user-questions/src/index.ts'))
  const { default: AgentRegistry } = await import(dshUrl('packages/core/agent/src/index.ts'))
  const { default: ApprovalService } = await import(dshUrl('packages/interaction/user-approval/src/index.ts'))
  const { createApiProxy, RpcId } = await import(dshUrl('packages/host/apiproxy/src/index.ts'))

  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(SystemPrompt, { persona: '' })
  await ctx.plugin(UserQuestionService)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(ApprovalService)

  // modelRuntimeConfigured stays false: no real model provider is wired, and
  // no model turn is ever triggered in 03B.
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

  send({ type: 'event', event: 'ready', payload: { pid: process.pid, dshVersion } })

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
            modelRuntimeConfigured: false,
          },
        })
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
