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
    const result = await this.bridge.request('agent-turn', { context, instruction })
    const text = result && typeof result.text === 'string' ? result.text : ''
    return parseProposalText(text)
  }
}
