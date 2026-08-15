import test from 'node:test'
import assert from 'node:assert/strict'

import { buildProposalInstruction, parseProposalText, InvalidProposalError } from '../src/infrastructure/runtime/proposal-protocol.mjs'

test('buildProposalInstruction embeds the read-only context and demands JSON only', () => {
  const instruction = buildProposalInstruction({ project: { id: 'p1', title: 'Personal OS' }, tasks: [] })
  assert.equal(typeof instruction, 'string')
  assert.ok(instruction.includes('"title"'))
  assert.ok(instruction.includes('"rationale"'))
  assert.ok(instruction.includes('p1'))
  assert.ok(instruction.includes('Personal OS'))
  assert.ok(/Return ONLY one valid JSON object/.test(instruction))
})

test('parseProposalText accepts an exact { title, rationale } object', () => {
  const parsed = parseProposalText('{"title":"Review priorities","rationale":"next useful step"}')
  assert.deepEqual(parsed, { title: 'Review priorities', rationale: 'next useful step' })
})

test('parseProposalText trims whitespace and title/rationale values', () => {
  const parsed = parseProposalText('  { "title": "  T  ", "rationale": " R " }  ')
  assert.deepEqual(parsed, { title: 'T', rationale: 'R' })
})

test('parseProposalText fails closed on invalid shapes', () => {
  const bad = [
    '',
    'not json',
    '[]',
    'null',
    '"a string"',
    '42',
    '{}',
    '{"title":"only title"}',
    '{"rationale":"only rationale"}',
    '{"title":"","rationale":"r"}',
    '{"title":"t","rationale":""}',
    '{"title":123,"rationale":"r"}',
    '{"title":"t","rationale":["r"]}',
    '{"title":"t","rationale":"r","extra":"x"}',
    '{"title":"t","rationale":"r"} trailing',
  ]
  for (const text of bad) {
    assert.throws(() => parseProposalText(text), InvalidProposalError, `expected rejection for: ${JSON.stringify(text)}`)
  }
})
