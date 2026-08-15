/**
 * Fixture runtime child — a real, separate OS process used by the 03A
 * dedicated-process tests. It intentionally does NOT import the parent's
 * protocol module, to prove the boundary is just framed JSON over stdio.
 *
 * Supported methods: ping, propose-next-project-step, shutdown, crash,
 * malformed, never-respond. Never touches the network, repositories, or SQLite.
 */
import readline from 'node:readline'

const FRAME = 'POSIPC '

function send(message) {
  process.stdout.write(`${FRAME}${JSON.stringify(message)}\n`)
}

const crashOnPropose = process.env.FIXTURE_CRASH_ON_PROPOSE === '1'
const noReady = process.env.FIXTURE_NO_READY === '1'

if (!noReady) {
  send({ type: 'event', event: 'ready', payload: { pid: process.pid } })
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity })

rl.on('line', (line) => {
  if (!line.startsWith(FRAME)) return
  let message
  try {
    message = JSON.parse(line.slice(FRAME.length))
  } catch {
    return
  }
  if (!message || message.type !== 'request') return

  switch (message.method) {
    case 'ping':
      send({ type: 'response', id: message.id, ok: true, result: { pong: true } })
      break
    case 'propose-next-project-step':
      if (crashOnPropose) {
        process.exit(9)
      }
      send({
        type: 'response',
        id: message.id,
        ok: true,
        result: {
          title: 'Implement Project bookshelf skeleton',
          rationale: 'Deterministic fixture proposal.',
        },
      })
      break
    case 'shutdown':
      send({ type: 'response', id: message.id, ok: true, result: { bye: true } })
      process.exit(0)
      break
    case 'crash':
      process.exit(9)
      break
    case 'malformed':
      process.stdout.write('unframed noise line\n')
      process.stdout.write(`${FRAME}{not-valid-json\n`)
      send({ type: 'response', id: message.id, ok: true, result: { done: true } })
      break
    case 'never-respond':
      // intentionally no response; the caller's request will time out
      break
    default:
      send({
        type: 'response',
        id: message.id,
        ok: false,
        error: { code: 'UNKNOWN_METHOD', message: `unknown method: ${message.method}` },
      })
  }
})

process.stdin.on('end', () => {
  process.exit(0)
})
