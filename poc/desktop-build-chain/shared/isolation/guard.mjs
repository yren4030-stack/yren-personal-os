import fs from 'node:fs';
import path from 'node:path';

export const ROOT_MARKER = '.yren-poc-root.json';
export const SCHEMA_VERSION = 1;

const CANDIDATES = new Set([
  'candidate-a-vite',
  'candidate-b-webpack',
]);

const PURPOSES = {
  poc: {
    envKey: 'LOCALAPPDATA',
    base: 'YrenPersonalOS-POC',
    markerPurpose: 'poc',
  },
  'independent-review': {
    envKey: 'LOCALAPPDATA',
    base: 'YrenPersonalOS-Test',
    markerPurpose: 'independent-review',
  },
  temp: {
    envKey: 'TEMP',
    base: 'YrenPersonalOS-POC',
    markerPurpose: 'poc',
  },
};

export class IsolationError extends Error {
  constructor(code) {
    super(`Isolation guard rejected request: ${code}`);
    this.name = 'IsolationError';
    this.code = code;
  }
}

function reject(code) {
  throw new IsolationError(code);
}

function normalizeWindows(value) {
  return path.win32
    .resolve(value)
    .replace(/[\\/]+$/, '')
    .toLowerCase();
}

function isInside(candidate, parent) {
  const child = normalizeWindows(candidate);
  const root = normalizeWindows(parent);

  return child === root || child.startsWith(`${root}\\`);
}

function requireEnv(env, key) {
  const value = env?.[key];

  if (!value || typeof value !== 'string') {
    reject(`MISSING_ENV_${key}`);
  }

  return value;
}

export function resolveApprovedRoot({
  candidate,
  purpose,
  env = process.env,
}) {
  if (!CANDIDATES.has(candidate)) {
    reject('UNKNOWN_CANDIDATE');
  }

  const spec = PURPOSES[purpose];

  if (!spec) {
    reject('UNKNOWN_PURPOSE');
  }

  return path.win32.join(
    requireEnv(env, spec.envKey),
    spec.base,
    candidate,
  );
}

export function resolveProductionRoot(env = process.env) {
  return path.win32.join(
    requireEnv(env, 'LOCALAPPDATA'),
    'YrenPersonalOS',
  );
}

function readAndValidateMarker(root, expected) {
  const markerPath = path.win32.join(root, ROOT_MARKER);

  if (!fs.existsSync(markerPath)) {
    reject('ROOT_MARKER_MISSING');
  }

  let marker;

  try {
    marker = JSON.parse(
      fs.readFileSync(markerPath, 'utf8'),
    );
  } catch {
    reject('ROOT_MARKER_INVALID_JSON');
  }

  if (
    marker?.candidate !== expected.candidate ||
    marker?.purpose !== expected.purpose ||
    marker?.environment !== expected.environment ||
    marker?.schemaVersion !== SCHEMA_VERSION
  ) {
    reject('ROOT_MARKER_MISMATCH');
  }
}

function assertRootBoundary(root, productionRoot) {
  if (
    isInside(root, productionRoot) ||
    isInside(productionRoot, root)
  ) {
    reject('PRODUCTION_ROOT_CONFLICT');
  }
}

function assertExistingPathDoesNotEscape(root, target) {
  const realRoot = fs.realpathSync.native(root);

  if (
    normalizeWindows(realRoot) !==
    normalizeWindows(root)
  ) {
    reject('ROOT_REPARSE_POINT');
  }

  const relative = path.win32.relative(root, target);
  let current = root;

  for (
    const segment of relative.split('\\').filter(Boolean)
  ) {
    current = path.win32.join(current, segment);

    if (!fs.existsSync(current)) {
      break;
    }

    const resolved = fs.realpathSync.native(current);

    if (!isInside(resolved, realRoot)) {
      reject('REPARSE_ESCAPE');
    }
  }
}

function classifyAbsoluteRequest(
  raw,
  { productionRoot, otherCandidateRoot },
) {
  const value = raw.replace(/\//g, '\\');

  if (/^\\\\[?.]\\/i.test(value)) {
    reject('DEVICE_OR_EXTENDED_PATH');
  }

  if (/^\\\\/i.test(value)) {
    reject('UNC_PATH');
  }

  if (
    path.win32.isAbsolute(value) ||
    /^[A-Za-z]:/.test(value)
  ) {
    const absolute = path.win32.resolve(value);

    if (isInside(absolute, productionRoot)) {
      reject('PRODUCTION_ROOT_REQUEST');
    }

    if (isInside(absolute, otherCandidateRoot)) {
      reject('CROSS_CANDIDATE_REQUEST');
    }

    reject('UNAPPROVED_ABSOLUTE_PATH');
  }
}

function assertRelativeChild(child, context) {
  if (
    typeof child !== 'string' ||
    child.length === 0 ||
    child.includes('\0')
  ) {
    reject('INVALID_CHILD_PATH');
  }

  classifyAbsoluteRequest(child, context);

  const normalizedSeparators =
    child.replace(/\//g, '\\');

  if (
    normalizedSeparators
      .split('\\')
      .includes('..')
  ) {
    reject('PARENT_TRAVERSAL');
  }

  if (normalizedSeparators.includes(':')) {
    reject('ALTERNATE_DATA_STREAM');
  }
}

export function assertIsolatedPath({
  candidate,
  purpose,
  environment,
  child,
  env = process.env,
}) {
  const root = resolveApprovedRoot({
    candidate,
    purpose,
    env,
  });

  const productionRoot =
    resolveProductionRoot(env);

  const otherCandidate =
    candidate === 'candidate-a-vite'
      ? 'candidate-b-webpack'
      : 'candidate-a-vite';

  const otherCandidateRoot =
    resolveApprovedRoot({
      candidate: otherCandidate,
      purpose,
      env,
    });

  assertRootBoundary(
    root,
    productionRoot,
  );

  if (
    !fs.existsSync(root) ||
    !fs.statSync(root).isDirectory()
  ) {
    reject('ROOT_MISSING');
  }

  const markerPurpose =
    PURPOSES[purpose].markerPurpose;

  readAndValidateMarker(root, {
    candidate,
    purpose: markerPurpose,
    environment,
  });

  assertRelativeChild(child, {
    productionRoot,
    otherCandidateRoot,
  });

  const target =
    path.win32.resolve(root, child);

  if (!isInside(target, root)) {
    reject('PATH_ESCAPE');
  }

  if (isInside(target, productionRoot)) {
    reject('PRODUCTION_ROOT_REQUEST');
  }

  if (isInside(target, otherCandidateRoot)) {
    reject('CROSS_CANDIDATE_REQUEST');
  }

  assertExistingPathDoesNotEscape(
    root,
    target,
  );

  return {
    root,
    target,
  };
}
