import { createInterface } from 'node:readline'
import { Context } from '@deepseek-ai/cordis'
import AgentRegistry, { type Agent } from '@deepseek-ai/dsh-agent'
import SessionStore from '@deepseek-ai/dsh-session'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import UserQuestionService from '@deepseek-ai/dsh-user-questions'
import ApprovalService from '@deepseek-ai/dsh-user-approval'
import { createApiProxy } from '../../packages/host/apiproxy/src/api-proxy.ts'
import { RpcId } from '../../packages/host/apiproxy/src/api/rpc.ts'

function emit(value: unknown): void {
  process.stdout.write(`POSIPC ${JSON.stringify(value)}\n`)
}

const ctx = new Context()
await ctx.plugin(SessionStore)
await ctx.plugin(SystemPrompt, { persona: '' })
await ctx.plugin(UserQuestionService)
await ctx.plugin(AgentRegistry)
await ctx.plugin(ApprovalService)

const api = createApiProxy(ctx, {
  defaultModelSelection: () => ({ provider: 'p', model: 'm' }),
  cwd: process.cwd(),
})

const muxAbort = new AbortController()
void (async () => {
  try {
    for await (const envelope of api.events.mux({ rpcId: RpcId('pos-child-mux'), payload: {} }, muxAbort.signal)) {
      emit({ type: 'host-event', envelope })
    }
  } catch (error) {
    if (!muxAbort.signal.aborted) {
      emit({ type: 'host-event-error', message: error instanceof Error ? error.message : String(error) })
    }
  }
})()

let approvalSequence = 0

async function handle(message: any): Promise<void> {
  switch (message?.type) {
    case 'ping':
      emit({ type: 'pong', pid: process.pid })
      return

    case 'approval.start': {
      const session = ctx.sessions.create()
      session.append('turn/start', { turn: 1 })
      const agent = { session } as unknown as Agent
      const sequence = ++approvalSequence
      void ctx.approval.request({
        agent,
        toolName: 'write',
        reason: 'Personal OS child-process bridge POC',
      }).then(
        outcome => emit({ type: 'approval-outcome', sequence, outcome }),
        error => emit({ type: 'approval-error', sequence, message: error instanceof Error ? error.message : String(error) }),
      )
      emit({ type: 'approval-started', sequence, sessionId: session.id })
      return
    }

    case 'client-response': {
      const receipt = await api.respond(message.response)
      emit({ type: 'client-response-receipt', receipt })
      return
    }

    case 'crash':
      process.exit(91)
      return

    case 'shutdown':
      muxAbort.abort()
      emit({ type: 'shutdown-ack' })
      process.exit(0)
      return

    default:
      emit({ type: 'protocol-error', message: `unsupported message: ${String(message?.type)}` })
  }
}

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity })
lines.on('line', line => {
  let message: unknown
  try {
    message = JSON.parse(line)
  } catch {
    emit({ type: 'protocol-error', message: 'invalid json' })
    return
  }
  void handle(message).catch(error => {
    emit({ type: 'command-error', message: error instanceof Error ? error.message : String(error) })
  })
})

emit({
  type: 'ready',
  pid: process.pid,
  host: 'dsh-apiproxy',
  carrier: 'stdio-json-lines',
  networkPortRequired: false,
  httpServerRequired: false,
})
