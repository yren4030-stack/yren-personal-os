/**
 * DeepSeekHarnessAgentRuntimeAdapter — implements the Personal OS
 * AgentRuntimePort in front of a RuntimeProcessBridge.
 *
 * The application layer only ever sees `proposeNextProjectStep({ context })`
 * and gets back a plain `{ title, rationale }`. It knows nothing about
 * processes, stdio, framing, the protocol, or any DSH SDK/Host/ApiProxy.
 */
export class DeepSeekHarnessAgentRuntimeAdapter {
  constructor(bridge) {
    if (!bridge || typeof bridge.request !== 'function') {
      throw new TypeError('DeepSeekHarnessAgentRuntimeAdapter requires a RuntimeProcessBridge with request()')
    }
    this.bridge = bridge
  }

  async proposeNextProjectStep({ context }) {
    const result = await this.bridge.request('propose-next-project-step', { context })
    if (!result || typeof result.title !== 'string' || result.title.trim() === '') {
      throw new TypeError('runtime returned an invalid proposal')
    }
    return {
      title: result.title.trim(),
      rationale: typeof result.rationale === 'string' ? result.rationale.trim() : '',
    }
  }
}
