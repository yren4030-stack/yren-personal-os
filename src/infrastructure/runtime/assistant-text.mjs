/**
 * Pure assistant-final-text extraction from a frozen DSH session event log.
 *
 * Follows the frozen DSH 47f9438 `assistant/message` event shape:
 *   { type: 'assistant/message', seq, time, data: { turn, step, message, usage? } }
 * where `message` is an AssistantMessage `{ id, role, content, source }` and
 * each text block is `{ type: 'text', text }`. This module is unit-tested
 * against that exact shape so a host E2E is not required to catch regressions.
 */
export const AGENT_TURN_FAILED = 'AGENT_TURN_FAILED'
export const AGENT_OUTPUT_MISSING = 'AGENT_OUTPUT_MISSING'

/**
 * Extract the final assistant text produced by the current turn.
 * @param {Array} events - frozen session events (SessionEvent[]).
 * @param {number} baselineSeq - session seq captured before the turn started;
 *   only events after this seq are considered.
 * @returns {{ ok: true, text: string } | { ok: false, code: string }}
 */
export function extractAssistantText(events, baselineSeq) {
  if (!Array.isArray(events)) {
    return { ok: false, code: AGENT_OUTPUT_MISSING }
  }
  const afterBaseline = events.filter((event) => event && typeof event.seq === 'number' && event.seq > baselineSeq)

  const turnEnd = [...afterBaseline].reverse().find((event) => event.type === 'turn/end')
  if (turnEnd && turnEnd.data && turnEnd.data.reason && turnEnd.data.reason.kind === 'error') {
    return { ok: false, code: AGENT_TURN_FAILED }
  }

  const assistant = [...afterBaseline].reverse().find((event) => event.type === 'assistant/message')
  if (!assistant || !assistant.data || !assistant.data.message) {
    return { ok: false, code: AGENT_OUTPUT_MISSING }
  }
  const content = assistant.data.message.content
  if (!Array.isArray(content)) {
    return { ok: false, code: AGENT_OUTPUT_MISSING }
  }
  const text = content
    .filter((block) => block && typeof block === 'object' && block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('')
  return { ok: true, text }
}
