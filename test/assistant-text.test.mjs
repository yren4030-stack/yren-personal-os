import test from 'node:test'
import assert from 'node:assert/strict'

import { extractAssistantText, AGENT_TURN_FAILED, AGENT_OUTPUT_MISSING } from '../src/infrastructure/runtime/assistant-text.mjs'

function assistantEvent(seq, text, { turn = 1, step = 1 } = {}) {
  return {
    type: 'assistant/message',
    seq,
    time: 0,
    data: {
      turn,
      step,
      message: {
        id: 'msg-1',
        role: 'assistant',
        source: { kind: 'model', provider: 'deepseek-official', model: 'personal-os-03c-mock' },
        content: [{ type: 'text', text }],
      },
    },
  }
}

test('extracts text from the frozen DSH assistant/message event shape', () => {
  const events = [
    { type: 'turn/start', seq: 1, time: 0, data: { turn: 1 } },
    assistantEvent(2, '{"title":"T","rationale":"R"}'),
    { type: 'turn/end', seq: 3, time: 0, data: { turn: 1, reason: { kind: 'completed' } } },
  ]
  const result = extractAssistantText(events, 0)
  assert.deepEqual(result, { ok: true, text: '{"title":"T","rationale":"R"}' })
})

test('only considers events after the baseline seq (ignores past turns)', () => {
  const events = [
    assistantEvent(1, 'OLD ANSWER'),
    { type: 'turn/start', seq: 2, time: 0, data: { turn: 2 } },
    assistantEvent(3, 'NEW ANSWER'),
  ]
  const result = extractAssistantText(events, 2)
  assert.deepEqual(result, { ok: true, text: 'NEW ANSWER' })
})

test('maps turn/end error to AGENT_TURN_FAILED', () => {
  const events = [
    { type: 'turn/start', seq: 1, time: 0, data: { turn: 1 } },
    { type: 'turn/end', seq: 2, time: 0, data: { turn: 1, reason: { kind: 'error', error: { code: 'x', message: 'y' } } } },
  ]
  const result = extractAssistantText(events, 0)
  assert.equal(result.ok, false)
  assert.equal(result.code, AGENT_TURN_FAILED)
})

test('maps missing assistant message or content to AGENT_OUTPUT_MISSING', () => {
  assert.deepEqual(extractAssistantText([], 0), { ok: false, code: AGENT_OUTPUT_MISSING })
  assert.deepEqual(extractAssistantText(undefined, 0), { ok: false, code: AGENT_OUTPUT_MISSING })

  const noMessage = [{ type: 'turn/start', seq: 1, time: 0, data: { turn: 1 } }]
  assert.deepEqual(extractAssistantText(noMessage, 0), { ok: false, code: AGENT_OUTPUT_MISSING })

  const noContent = [
    { type: 'assistant/message', seq: 1, time: 0, data: { turn: 1, step: 1, message: { id: 'm', role: 'assistant', source: { kind: 'model' } } } },
  ]
  assert.deepEqual(extractAssistantText(noContent, 0), { ok: false, code: AGENT_OUTPUT_MISSING })

  const nonArrayContent = [
    { type: 'assistant/message', seq: 1, time: 0, data: { turn: 1, step: 1, message: { id: 'm', role: 'assistant', content: 'not-an-array' } } },
  ]
  assert.deepEqual(extractAssistantText(nonArrayContent, 0), { ok: false, code: AGENT_OUTPUT_MISSING })
})

test('concatenates only text blocks, ignoring non-text blocks', () => {
  const events = [
    {
      type: 'assistant/message',
      seq: 1,
      time: 0,
      data: {
        turn: 1,
        step: 1,
        message: {
          id: 'm',
          role: 'assistant',
          content: [
            { type: 'text', text: '{"title":"A",' },
            { type: 'tool_call', id: 'x', name: 'f', arguments: '{}' },
            { type: 'text', text: '"rationale":"B"}' },
          ],
        },
      },
    },
  ]
  const result = extractAssistantText(events, 0)
  assert.deepEqual(result, { ok: true, text: '{"title":"A","rationale":"B"}' })
})
