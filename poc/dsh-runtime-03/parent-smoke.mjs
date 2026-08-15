import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'

const dshRoot = process.env.DSH_ROOT
if (!dshRoot) throw new Error('DSH_ROOT is required')

const childPath = resolve(dshRoot, 'poc', 'pos-dsh-runtime-03', 'host-child.ts')

function startChild() {
  const child = spawn(process.execPath, ['--import', 'tsx/esm', childPath], {
    cwd: dshRoot,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
    env: { ...process.env },
  })

  const messages = []
  const waiters = []
  let stderr = ''

  const lines = createInterface({ input: child.stdout, crlfDelay: Infinity })
  lines.on('line', line => {
    if (!line.startsWith('POSIPC ')) return
    const message = JSON.parse(line.slice('POSIPC '.length))
    messages.push(message)
    for (let i = waiters.length - 1; i >= 0; i -= 1) {
      const waiter = waiters[i]
      if (waiter.predicate(message)) {
        waiters.splice(i, 1)
        waiter.resolve(message)
      }
    }
  })
  child.stderr.on('data', chunk => { stderr += String(chunk) })

  function send(message) {
    child.stdin.write(`${JSON.stringify(message)}\n`)
  }

  function waitFor(predicate, timeoutMs = 5000) {
    const existing = messages.find(predicate)
    if (existing) return Promise.resolve(existing)
    return new Promise((resolvePromise, rejectPromise) => {
      const waiter = { predicate, resolve: resolvePromise }
      waiters.push(waiter)
      const timer = setTimeout(() => {
        const index = waiters.indexOf(waiter)
        if (index >= 0) waiters.splice(index, 1)
        rejectPromise(new Error(`timeout waiting for child message; stderr=${stderr}`))
      }, timeoutMs)
      waiter.resolve = value => {
        clearTimeout(timer)
        resolvePromise(value)
      }
    })
  }

  const exited = new Promise(resolvePromise => {
    child.once('exit', (code, signal) => resolvePromise({ code, signal, stderr }))
  })

  return { child, send, waitFor, exited }
}

const first = startChild()
const ready1 = await first.waitFor(message => message.type === 'ready')
if (ready1.host !== 'dsh-apiproxy' || ready1.networkPortRequired !== false || ready1.httpServerRequired !== false) {
  throw new Error(`unexpected ready payload: ${JSON.stringify(ready1)}`)
}

first.send({ type: 'approval.start' })
const requestedEnvelope = await first.waitFor(message => message.type === 'host-event' && message.envelope?.payload?.type === 'approval/requested')
const requested = requestedEnvelope.envelope.payload

first.send({
  type: 'client-response',
  response: {
    type: 'client-response',
    rpcId: requestedEnvelope.envelope.rpcId,
    result: {
      ok: true,
      value: {
        sessionId: requested.sessionId,
        approvalId: requested.approvalId,
        outcome: 'allowed-once',
      },
    },
  },
})

const receipt = await first.waitFor(message => message.type === 'client-response-receipt')
if (receipt.receipt?.accepted !== true) throw new Error(`approval response rejected: ${JSON.stringify(receipt)}`)
const outcome = await first.waitFor(message => message.type === 'approval-outcome')
if (outcome.outcome !== 'allowed-once') throw new Error(`unexpected approval outcome: ${JSON.stringify(outcome)}`)

first.send({ type: 'crash' })
const crashed = await first.exited
if (crashed.code !== 91) throw new Error(`child did not exit with injected crash code 91: ${JSON.stringify(crashed)}`)

const second = startChild()
const ready2 = await second.waitFor(message => message.type === 'ready')
if (ready2.pid === ready1.pid) throw new Error('restart did not create a new child process')
second.send({ type: 'ping' })
const pong = await second.waitFor(message => message.type === 'pong')
if (pong.pid !== ready2.pid) throw new Error(`pong pid mismatch: ${JSON.stringify({ ready2, pong })}`)
second.send({ type: 'shutdown' })
await second.waitFor(message => message.type === 'shutdown-ack')
const stopped = await second.exited
if (stopped.code !== 0) throw new Error(`restarted child did not shut down cleanly: ${JSON.stringify(stopped)}`)

console.log(JSON.stringify({
  result: 'PASS',
  carrier: 'stdio-json-lines',
  networkPortRequired: false,
  httpServerRequired: false,
  hostEventCrossProcess: true,
  crashIsolated: true,
  restartSucceeded: true,
}))
