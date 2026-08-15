/**
 * AgentRuntimePort — the boundary between the Project Read/Propose application
 * and an AI runtime.
 *
 * This is a Personal OS-owned contract. It must NOT leak any DeepSeek Harness
 * / SDK / Host / Cordis type. It currently expresses only the single slice the
 * Project Read/Propose Loop needs; it is intentionally not the full future
 * agent capability surface.
 *
 * @typedef {object} AgentProposeInput
 * @property {object} context  Frozen, read-only project context of shape
 *                             { project, tasks }. Implementations must not
 *                             mutate it.
 *
 * @typedef {object} AgentProposalCandidate
 * @property {string} title       Required non-empty proposal title.
 * @property {string} [rationale] Optional explanation.
 *
 * @typedef {object} AgentRuntimePort
 * @property {(input: AgentProposeInput) => Promise<AgentProposalCandidate>} proposeNextProjectStep
 */

export const AGENT_RUNTIME_METHODS = Object.freeze(['proposeNextProjectStep'])
