/**
 * Personal OS runtime infrastructure public surface.
 *
 * Factories here build runtime objects; nothing is spawned at import time.
 * The SQLite persistence composition remains separate and never spawns a
 * runtime process — the two lifecycles are wired together by the caller.
 */
import { RuntimeProcessBridge, RUNTIME_BRIDGE_STATES } from './runtime-process-bridge.mjs'
import { DeepSeekHarnessAgentRuntimeAdapter } from './deepseek-harness-agent-runtime-adapter.mjs'
import { DeepSeekHarnessHostBinding } from './deepseek-harness-host-binding.mjs'
import { createDeepSeekHarnessLaunchConfig, resolveRealDshHostChildEntry } from './dsh-launch-config.mjs'
import { buildChildEnvironment, CHILD_ENVIRONMENT_ALLOWED_KEYS } from './environment.mjs'
import {
  FRAMING_PREFIX,
  ProtocolError,
  encodeMessage,
  decodeMessage,
  buildRequest,
  buildSuccessResponse,
  buildFailureResponse,
  buildEvent,
  isRequest,
  isResponse,
  isEvent,
} from './protocol.mjs'

export {
  RuntimeProcessBridge,
  RUNTIME_BRIDGE_STATES,
  DeepSeekHarnessAgentRuntimeAdapter,
  DeepSeekHarnessHostBinding,
  createDeepSeekHarnessLaunchConfig,
  resolveRealDshHostChildEntry,
  buildChildEnvironment,
  CHILD_ENVIRONMENT_ALLOWED_KEYS,
  FRAMING_PREFIX,
  ProtocolError,
  encodeMessage,
  decodeMessage,
  buildRequest,
  buildSuccessResponse,
  buildFailureResponse,
  buildEvent,
  isRequest,
  isResponse,
  isEvent,
}

export function createRuntimeProcessBridge(config) {
  return new RuntimeProcessBridge(config)
}

export function createDeepSeekHarnessAgentRuntime(bridge) {
  return new DeepSeekHarnessAgentRuntimeAdapter(bridge)
}

export function createDeepSeekHarnessHostBinding(config) {
  return new DeepSeekHarnessHostBinding(config)
}
