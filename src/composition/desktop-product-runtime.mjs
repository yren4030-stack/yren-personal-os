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
      const mock = await startMockServer()
      extraEnv.POS_DSH_MOCK_BASE_URL = mock.baseURL
      extraEnv.POS_DSH_TEST_API_KEY = 'mock-key'
      disposers.push(() => mock.close())
    }
    binding = new DeepSeekHarnessHostBinding({ dshRoot, extraEnv })
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
        if (binding) await binding.start()
        state = 'ready'
      } catch (error) {
        state = 'unavailable'
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
