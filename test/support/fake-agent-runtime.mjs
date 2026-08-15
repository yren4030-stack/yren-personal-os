/**
 * Deterministic FakeAgentRuntime for tests and local development.
 *
 * Implements AgentRuntimePort. It never touches the network, never reads API
 * keys, and never receives repository access — it only receives the frozen,
 * read-only project context. It is a test double, not a product fact source.
 */
import { AGENT_RUNTIME_METHODS } from '../../src/application/agent-runtime-port.mjs'

const DEFAULT_CANDIDATE = Object.freeze({
  title: 'Implement Project bookshelf skeleton',
  rationale: 'Deterministic fake proposal.',
})

export class FakeAgentRuntime {
  /**
   * @param {Array<{ title: string, rationale?: string }>} [candidates]
   *   Optional queue of proposal candidates returned one per call. Defaults to
   *   a single deterministic candidate.
   */
  constructor(candidates) {
    this.candidates =
      candidates && candidates.length > 0 ? candidates.map((c) => Object.freeze({ ...c })) : [DEFAULT_CANDIDATE]
    this.index = 0
    this.calls = []
  }

  async proposeNextProjectStep({ context }) {
    this.calls.push(context)
    const candidate = this.candidates[Math.min(this.index, this.candidates.length - 1)]
    this.index += 1
    return { ...candidate }
  }
}

// Static, import-time proof that the fake satisfies the port surface.
for (const method of AGENT_RUNTIME_METHODS) {
  if (typeof FakeAgentRuntime.prototype[method] !== 'function') {
    throw new TypeError(`FakeAgentRuntime is missing AgentRuntimePort method: ${method}`)
  }
}
