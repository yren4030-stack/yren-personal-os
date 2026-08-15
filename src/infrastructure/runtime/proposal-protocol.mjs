/**
 * Personal OS-owned proposal prompt + strict raw-output boundary.
 *
 * The DSH child never decides the Personal OS business protocol. Personal OS
 * builds the instruction, and this module strictly validates the assistant's
 * raw final text into the AgentRuntimePort `{ title, rationale }` shape.
 */
export const PROPOSAL_JSON_CODE = 'INVALID_AGENT_PROPOSAL'

export class InvalidProposalError extends Error {
  constructor(message) {
    super(message)
    this.name = 'InvalidProposalError'
    this.code = PROPOSAL_JSON_CODE
  }
}

/**
 * Build the Personal OS-owned instruction for a proposal turn. Only JSON-safe
 * read-only project context is embedded; no repositories or database objects
 * cross into the prompt.
 */
export function buildProposalInstruction(context) {
  const serialized = JSON.stringify(context ?? {})
  return [
    'You are proposing the next concrete step for a Personal OS project.',
    'Return ONLY one valid JSON object and nothing else (no markdown fences, no prose).',
    'The JSON object must have exactly these two string fields:',
    '{"title": string, "rationale": string}',
    'Both fields must be non-empty strings. Do not add any other fields.',
    '',
    `Read-only project context (JSON): ${serialized}`,
  ].join('\n')
}

/**
 * Strictly parse the assistant's raw final text into a proposal candidate.
 * Fails closed on anything other than a top-level object with exactly the two
 * non-empty string fields `title` and `rationale`.
 */
export function parseProposalText(text) {
  if (typeof text !== 'string') {
    throw new InvalidProposalError('assistant output is not a string')
  }
  let parsed
  try {
    parsed = JSON.parse(text.trim())
  } catch {
    throw new InvalidProposalError('assistant output is not valid JSON')
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new InvalidProposalError('assistant output must be a JSON object')
  }
  for (const key of Object.keys(parsed)) {
    if (key !== 'title' && key !== 'rationale') {
      throw new InvalidProposalError(`assistant output has an unexpected field: ${key}`)
    }
  }
  if (typeof parsed.title !== 'string' || parsed.title.trim() === '') {
    throw new InvalidProposalError('assistant output title must be a non-empty string')
  }
  if (typeof parsed.rationale !== 'string' || parsed.rationale.trim() === '') {
    throw new InvalidProposalError('assistant output rationale must be a non-empty string')
  }
  return { title: parsed.title.trim(), rationale: parsed.rationale.trim() }
}
