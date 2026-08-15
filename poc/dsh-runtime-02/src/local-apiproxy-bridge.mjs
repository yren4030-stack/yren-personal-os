import { randomUUID } from 'node:crypto'

export const bridgeTransportFacts = Object.freeze({
  carrier: 'in-process-local',
  networkPortRequired: false,
  httpServerRequired: false,
  rendererSafeMessages: true,
})

function rpcId(label) {
  return `pos-${label}-${randomUUID()}`
}

function unwrapRpc(response) {
  if (response?.result?.ok === true) return response.result.value
  const error = new Error(response?.result?.error?.message ?? 'DSH Host request failed')
  error.code = response?.result?.error?.code ?? 'runtime-host-error'
  error.details = response?.result?.error?.details
  throw error
}

function normalizeControlEnvelope(envelope) {
  const payload = envelope?.payload
  if (!payload || typeof payload !== 'object') return null

  switch (payload.type) {
    case 'approval/requested':
      return {
        kind: 'approval-request',
        requestId: envelope.rpcId,
        sessionId: payload.sessionId,
        approvalId: payload.approvalId,
        toolName: payload.toolName,
        ...(payload.callId === undefined ? {} : { callId: payload.callId }),
        ...(payload.reason === undefined ? {} : { reason: payload.reason }),
      }
    case 'approval/resolved':
      return {
        kind: 'approval-resolved',
        sessionId: payload.sessionId,
        approvalId: payload.approvalId,
        outcome: payload.outcome,
      }
    case 'question/requested':
      return {
        kind: 'question-request',
        requestId: envelope.rpcId,
        sessionId: payload.sessionId,
        questions: payload.questions,
      }
    case 'question/resolved':
      return {
        kind: 'question-resolved',
        sessionId: payload.sessionId,
        requestId: payload.questionRpcId,
        outcome: payload.outcome,
      }
    default:
      return null
  }
}

export class PersonalOsLocalApiProxyBridge {
  constructor(apiProxy) {
    if (!apiProxy?.sessions?.cancel || !apiProxy?.events?.mux || !apiProxy?.respond) {
      throw new TypeError('A compatible DSH ApiProxy is required')
    }
    this.api = apiProxy
  }

  openControlChannel(listener) {
    if (typeof listener !== 'function') throw new TypeError('listener must be a function')
    const abort = new AbortController()
    let closed = false

    const done = (async () => {
      for await (const envelope of this.api.events.mux({ rpcId: rpcId('mux'), payload: {} }, abort.signal)) {
        const control = normalizeControlEnvelope(envelope)
        if (control !== null) await listener(control)
      }
    })()

    return {
      close: async () => {
        if (!closed) {
          closed = true
          abort.abort()
        }
        try {
          await done
        } catch (error) {
          if (!abort.signal.aborted) throw error
        }
      },
      done,
    }
  }

  async handleRendererRequest(message) {
    if (!message || typeof message !== 'object') throw new TypeError('renderer message must be an object')

    switch (message.type) {
      case 'session.cancel':
        return unwrapRpc(await this.api.sessions.cancel({
          rpcId: rpcId('cancel'),
          payload: { sessionId: message.sessionId },
        }))

      case 'approval.respond':
        return this.api.respond({
          type: 'client-response',
          rpcId: message.requestId,
          result: {
            ok: true,
            value: {
              sessionId: message.sessionId,
              approvalId: message.approvalId,
              outcome: message.outcome,
            },
          },
        })

      case 'question.respond':
        return this.api.respond({
          type: 'client-response',
          rpcId: message.requestId,
          result: {
            ok: true,
            value: {
              sessionId: message.sessionId,
              answer: message.answer,
            },
          },
        })

      default:
        throw new RangeError(`Unsupported renderer request: ${String(message.type)}`)
    }
  }
}
