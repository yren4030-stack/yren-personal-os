/**
 * DeepSeekHarnessAgentRuntimeAdapter — implements the Personal OS
 * AgentRuntimePort in front of a RuntimeProcessBridge.
 *
 * It maps `proposeNextProjectStep({ context })` to a real DSH agent turn
 * (`agent-turn`) on the other side of the bridge, then strictly parses the
 * assistant's raw final text through the Personal OS proposal protocol. The
 * application layer only ever sees `{ title, rationale }` and knows nothing of
 * processes, stdio, framing, DSH, agents, sessions, or the mock LLM.
 */
import { buildProposalInstruction, parseProposalText } from './proposal-protocol.mjs'

export class DeepSeekHarnessAgentRuntimeAdapter {
  constructor(bridge) {
    if (!bridge || typeof bridge.request !== 'function') {
      throw new TypeError('DeepSeekHarnessAgentRuntimeAdapter requires a RuntimeProcessBridge with request()')
    }
    this.bridge = bridge
  }

  async proposeNextProjectStep({ context }) {
    const instruction = buildProposalInstruction(context)
    let result
    try {
      result = await this.bridge.request('agent-turn', { context, instruction })
    } catch (error) {
      // Bounded Main-side diagnostic for validation/development only; the
      // Renderer keeps the stable AGENT_TURN_FAILED contract untouched.
      const code = error && error.code ? error.code : 'AGENT_TURN_ERROR'
      const message = error && error.message ? String(error.message).slice(0, 500) : 'unknown'
      console.error(`[desktop-runtime] agent turn failed: code=${code} message=${message}`)
      throw error
    }
    const text = result && typeof result.text === 'string' ? result.text : ''
    return parseProposalText(text)
  }
}
