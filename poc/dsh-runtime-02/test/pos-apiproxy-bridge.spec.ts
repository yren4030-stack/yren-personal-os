import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import AgentRegistry, { type Agent } from '@deepseek-ai/dsh-agent'
import SessionStore from '@deepseek-ai/dsh-session'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import UserQuestionService from '@deepseek-ai/dsh-user-questions'
import ApprovalService from '@deepseek-ai/dsh-user-approval'
import type { ApiProxy } from '@deepseek-ai/dsh-host-apiproxy/api'
import { createApiProxy } from '../src/api-proxy.ts'

const posRoot = process.env.POS_POC_ROOT
if (!posRoot) throw new Error('POS_POC_ROOT is required')

const bridgeModule = await import(pathToFileURL(resolve(posRoot, 'src', 'local-apiproxy-bridge.mjs')).href)
const { PersonalOsLocalApiProxyBridge, bridgeTransportFacts } = bridgeModule

/**
 * Golden Host fixture for the Personal OS compatibility boundary.
 * Keep this service set aligned with the frozen DSH Host approval/question
 * contract tests; do not add plugins merely to make this POC green.
 */
async function createDshHostFixture(): Promise<{ ctx: Context; api: ApiProxy }> {
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
  return { ctx, api }
}

/**
 * A minimal live root agent in an open turn.
 * DSH approval audit events are required to be turn-enclosed; this mirrors
 * the lifecycle used by the frozen official Host approval contract fixture.
 */
function registeredAgent(ctx: Context, overrides: Partial<Agent> = {}): Agent {
  const session = ctx.sessions.create()
  session.append('turn/start', { turn: 1 })
  const value = {
    id: session.id,
    session,
    status: 'idle',
    ctx,
    ...overrides,
  } as Agent
  ctx.agents.register(value)
  return value
}

async function waitFor<T>(predicate: (message: any) => message is T, messages: any[]): Promise<T> {
  for (let i = 0; i < 200; i += 1) {
    const found = messages.find(predicate)
    if (found) return found
    await new Promise(resolve => setTimeout(resolve, 5))
  }
  throw new Error('timed out waiting for POS bridge control message')
}

describe('Personal OS local ApiProxy bridge', () => {
  it('passes the frozen DSH Host fixture contract before bridge behavior tests', async () => {
    const { ctx, api } = await createDshHostFixture()
    expect(ctx.sessions).toBeDefined()
    expect(ctx.agents).toBeDefined()
    expect(ctx.userQuestions).toBeDefined()
    expect(ctx.approval).toBeDefined()
    expect(api.events.mux).toEqual(expect.any(Function))
    expect(api.sessions.cancel).toEqual(expect.any(Function))
    expect(api.respond).toEqual(expect.any(Function))

    const agent = registeredAgent(ctx)
    expect(ctx.agents.get(agent.id)).toBe(agent)
    expect(agent.session.events.at(-1)?.type).toBe('turn/start')
  })

  it('uses a local in-process carrier with no network server requirement', () => {
    expect(bridgeTransportFacts).toEqual({
      carrier: 'in-process-local',
      networkPortRequired: false,
      httpServerRequired: false,
      rendererSafeMessages: true,
    })
  })

  it('round-trips approval through POS-neutral control messages', async () => {
    const { ctx, api } = await createDshHostFixture()
    const bridge = new PersonalOsLocalApiProxyBridge(api)
    const messages: any[] = []
    const channel = bridge.openControlChannel(message => { messages.push(message) })
    const agent = registeredAgent(ctx)

    try {
      const pending = ctx.approval.request({
        agent,
        toolName: 'write',
        reason: 'Personal OS approval POC',
      })

      const request = await waitFor(
        (message): message is any => message?.kind === 'approval-request',
        messages,
      )
      expect(request).toMatchObject({
        kind: 'approval-request',
        sessionId: agent.session.id,
        toolName: 'write',
        reason: 'Personal OS approval POC',
      })

      expect(await bridge.handleRendererRequest({
        type: 'approval.respond',
        requestId: request.requestId,
        sessionId: request.sessionId,
        approvalId: request.approvalId,
        outcome: 'allowed-once',
      })).toEqual({ accepted: true })
      await expect(pending).resolves.toBe('allowed-once')
      await waitFor((message): message is any => message?.kind === 'approval-resolved', messages)
    } finally {
      await channel.close()
    }
  })

  it('round-trips a user question through POS-neutral control messages', async () => {
    const { ctx, api } = await createDshHostFixture()
    const bridge = new PersonalOsLocalApiProxyBridge(api)
    const messages: any[] = []
    const channel = bridge.openControlChannel(message => { messages.push(message) })
    const agent = registeredAgent(ctx)

    try {
      const pending = ctx.userQuestions.ask({
        agent,
        questions: [{
          id: 'target',
          question: 'Choose one target',
          options: [{ label: 'Code' }, { label: 'Docs' }],
        }],
      })

      const request = await waitFor(
        (message): message is any => message?.kind === 'question-request',
        messages,
      )
      expect(request.sessionId).toBe(agent.session.id)

      expect(await bridge.handleRendererRequest({
        type: 'question.respond',
        requestId: request.requestId,
        sessionId: request.sessionId,
        answer: { answers: [{ id: 'target', selected: ['Code'] }] },
      })).toEqual({ accepted: true })
      await expect(pending).resolves.toEqual({ answers: [{ id: 'target', selected: ['Code'] }] })
      await waitFor((message): message is any => message?.kind === 'question-resolved', messages)
    } finally {
      await channel.close()
    }
  })

  it('routes renderer cancel through the real Host session.cancel surface', async () => {
    const { ctx, api } = await createDshHostFixture()
    let observedCause: unknown = null
    const agent = registeredAgent(ctx, {
      status: 'running',
      cancel: ((cause: unknown) => { observedCause = cause }) as Agent['cancel'],
    })
    const bridge = new PersonalOsLocalApiProxyBridge(api)

    expect(await bridge.handleRendererRequest({
      type: 'session.cancel',
      sessionId: agent.session.id,
    })).toEqual({ accepted: true })
    expect(observedCause).toEqual({ kind: 'user' })
  })
})
