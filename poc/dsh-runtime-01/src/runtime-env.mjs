const REQUIRED_WINDOWS_KEYS = [
  'SystemRoot',
  'WINDIR',
  'COMSPEC',
  'PATHEXT',
  'TEMP',
  'TMP',
]

const OPTIONAL_PROCESS_KEYS = [
  'PATH',
  'Path',
  'PROCESSOR_ARCHITECTURE',
  'NUMBER_OF_PROCESSORS',
]

export function buildDshChildEnv({
  parentEnv = process.env,
  extra = {},
  credentialKeys = [],
  requiredKeys = REQUIRED_WINDOWS_KEYS,
  optionalKeys = OPTIONAL_PROCESS_KEYS,
} = {}) {
  const env = {}

  for (const key of [...requiredKeys, ...optionalKeys, ...credentialKeys]) {
    const value = parentEnv[key]
    if (typeof value === 'string' && value.length > 0) env[key] = value
  }

  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined || value === null) continue
    env[key] = String(value)
  }

  return env
}

export function redactEnvForEvidence(env, secretKeys = []) {
  const secretSet = new Set(secretKeys)
  return Object.fromEntries(Object.entries(env).map(([key, value]) => [
    key,
    secretSet.has(key) ? '<redacted>' : value,
  ]))
}
