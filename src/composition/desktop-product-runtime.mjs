/**
 * Desktop product composition root — owns the SQLite composition, the
 * AgentRuntimePort implementation (real DSH binding or an explicit test fake),
 * the DesktopProductFacade, the appearance storage, and the runtime lifecycle.
 *
 * It never silently falls back to a fake runtime. Runtime modes are explicit:
 *   - real-dsh             : real DSH Host child (no mock, needs dshRoot)
 *   - validation-local-mock: real DSH Host child + official local mock LLM
 *   - unit-test-fake       : an EXPLICITLY supplied fake (tests only)
 */
import { createProjectReadProposeComposition } from './project-read-propose-composition.mjs'
import { DesktopProductFacade } from '../application/desktop-product-facade.mjs'
import { AppearanceService } from '../application/appearance-service.mjs'
import { DeepSeekHarnessHostBinding } from '../infrastructure/runtime/deepseek-harness-host-binding.mjs'
import { DeepSeekHarnessAgentRuntimeAdapter } from '../infrastructure/runtime/deepseek-harness-agent-runtime-adapter.mjs'

export const DESKTOP_RUNTIME_MODES = Object.freeze({
  REAL_DSH: 'real-dsh',
  VALIDATION_LOCAL_MOCK: 'validation-local-mock',
  UNIT_TEST_FAKE: 'unit-test-fake',
})

/**
 * @param {object} options
 * @param {string} options.mode
 * @param {string} options.databasePath
 * @param {{ load: () => object, save: (object) => void }} options.appearanceStorage
 * @param {string} [options.dshRoot]  required for real-dsh / validation-local-mock
 * @param {() => Date} [options.clock]
 * @param {object} [options.fakeAgentRuntime]  required for unit-test-fake
 * @param {() => Promise<{ baseURL: string, close: () => Promise<void> }>} [options.startMockServer]
 *   required for validation-local-mock; starts the official DSH mock (127.0.0.1)
 */
export async function createDesktopProductRuntime({
  mode,
  databasePath,
  appearanceStorage,
  dshRoot,
  clock,
  fakeAgentRuntime,
  startMockServer,
}) {
  if (!mode || !Object.values(DESKTOP_RUNTIME_MODES).includes(mode)) {
    throw new Error(`unknown desktop runtime mode: ${mode}`)
  }

  const appearance = new AppearanceService(appearanceStorage)

  let agentRuntime
  let binding = null
  const disposers = []
  let state = mode === DESKTOP_RUNTIME_MODES.UNIT_TEST_FAKE ? 'ready' : 'starting'

  // Bounded main-process startup diagnostics (dev/validation only; never
  // forwarded to the Renderer). No credentials, env, or payload data.
  const diag = (...parts) => console.log('[desktop-runtime]', ...parts)

  if (mode === DESKTOP_RUNTIME_MODES.UNIT_TEST_FAKE) {
    if (!fakeAgentRuntime || typeof fakeAgentRuntime.proposeNextProjectStep !== 'function') {
      throw new Error('unit-test-fake mode requires an explicit fakeAgentRuntime implementing AgentRuntimePort')
    }
    agentRuntime = fakeAgentRuntime
  } else {
    if (!dshRoot) {
      throw new Error(`desktop runtime mode "${mode}" requires dshRoot`)
    }
    const extraEnv = {}
    if (mode === DESKTOP_RUNTIME_MODES.VALIDATION_LOCAL_MOCK) {
      if (typeof startMockServer !== 'function') {
        throw new Error('validation-local-mock mode requires startMockServer')
      }
      let mock
      try {
        diag('mock server: starting')
        mock = await startMockServer()
      } catch (error) {
        console.error(`[desktop-runtime] failed at stage=mock-server code=${error && error.code ? error.code : 'MOCK_SERVER_FAILED'}`)
        throw error
      }
      diag('mock server: ready')
      extraEnv.POS_DSH_MOCK_BASE_URL = mock.baseURL
      extraEnv.POS_DSH_TEST_API_KEY = 'mock-key'
      disposers.push(() => mock.close())
    }
    binding = new DeepSeekHarnessHostBinding({ dshRoot, extraEnv })
    diag('dsh binding: created')
    binding.bridge.on('state', (bridgeState) => {
      if (bridgeState === 'starting') diag('bridge: waiting-ready')
      if (bridgeState === 'ready') diag('bridge: ready')
      if (bridgeState === 'crashed') diag('bridge: crashed')
    })
    disposers.push(() => binding.stop())
    agentRuntime = new DeepSeekHarnessAgentRuntimeAdapter(binding.bridge)
  }

  const composition = createProjectReadProposeComposition({ databasePath, agentRuntime, clock })

  const facade = new DesktopProductFacade({
    service: composition.service,
    projectRepository: composition.projectRepository,
    taskRepository: composition.taskRepository,
    proposalRepository: composition.proposalRepository,
    appearanceService: appearance,
    runtimeMode: mode,
    getRuntimeState: () => state,
  })

  return {
    facade,
    appearance,
    agentRuntime,
    composition,
    async start() {
      if (state === 'ready') return
      try {
        if (binding) {
          diag('dsh binding: starting')
          await binding.start()
          diag('agent runtime: ready')
        }
        state = 'ready'
        diag('startup complete')
      } catch (error) {
        state = 'unavailable'
        console.error(`[desktop-runtime] failed at stage=binding-start code=${error && error.code ? error.code : 'START_FAILED'}`)
        if (error && typeof error.stderr === 'string' && error.stderr.trim().length > 0) {
          // Already bounded (<= stderrMaxChars) and redacted at capture.
          console.error('[desktop-runtime] child stderr:')
          console.error(error.stderr)
        }
        throw error
      }
    },
    async stop() {
      state = 'unavailable'
      for (const dispose of [...disposers].reverse()) {
        await dispose()
      }
      composition.close()
    },
  }
}
