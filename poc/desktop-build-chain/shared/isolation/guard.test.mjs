import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  ROOT_MARKER,
  SCHEMA_VERSION,
  IsolationError,
  resolveApprovedRoot,
  resolveProductionRoot,
  assertIsolatedPath,
} from './guard.mjs';

const environment = 'preflight-test';

const sandbox = fs.mkdtempSync(
  path.join(os.tmpdir(), 'yren-isolation-'),
);

const env = {
  LOCALAPPDATA: path.join(sandbox, 'Local'),
  TEMP: path.join(sandbox, 'Temp'),
};

const candidateA = 'candidate-a-vite';
const candidateB = 'candidate-b-webpack';

const aRoot = resolveApprovedRoot({
  candidate: candidateA,
  purpose: 'poc',
  env,
});

const bRoot = resolveApprovedRoot({
  candidate: candidateB,
  purpose: 'poc',
  env,
});

const productionRoot = resolveProductionRoot(env);

function marker(root, candidate, purpose = 'poc') {
  fs.mkdirSync(root, { recursive: true });

  fs.writeFileSync(
    path.win32.join(root, ROOT_MARKER),
    JSON.stringify(
      {
        candidate,
        purpose,
        environment,
        schemaVersion: SCHEMA_VERSION,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
}

function expectCode(fn, code) {
  assert.throws(
    fn,
    error =>
      error instanceof IsolationError &&
      error.code === code,
  );
}

marker(aRoot, candidateA);
marker(bRoot, candidateB);

test('approved child path is accepted', () => {
  const result = assertIsolatedPath({
    candidate: candidateA,
    purpose: 'poc',
    environment,
    child: 'data\\probe.txt',
    env,
  });

  assert.equal(
    result.root.toLowerCase(),
    aRoot.toLowerCase(),
  );
});

test('Production root is rejected before write', () => {
  expectCode(
    () =>
      assertIsolatedPath({
        candidate: candidateA,
        purpose: 'poc',
        environment,
        child: path.win32.join(
          productionRoot,
          'data',
          'forbidden.txt',
        ),
        env,
      }),
    'PRODUCTION_ROOT_REQUEST',
  );
});

test('case-variant Production root is rejected', () => {
  expectCode(
    () =>
      assertIsolatedPath({
        candidate: candidateA,
        purpose: 'poc',
        environment,
        child: path.win32.join(
          productionRoot.toUpperCase(),
          'data',
          'forbidden.txt',
        ),
        env,
      }),
    'PRODUCTION_ROOT_REQUEST',
  );
});

test('parent traversal is rejected', () => {
  expectCode(
    () =>
      assertIsolatedPath({
        candidate: candidateA,
        purpose: 'poc',
        environment,
        child: '..\\escape.txt',
        env,
      }),
    'PARENT_TRAVERSAL',
  );
});

test('unapproved absolute path is rejected', () => {
  expectCode(
    () =>
      assertIsolatedPath({
        candidate: candidateA,
        purpose: 'poc',
        environment,
        child: 'C:\\Windows\\Temp\\forbidden.txt',
        env,
      }),
    'UNAPPROVED_ABSOLUTE_PATH',
  );
});

test('UNC path is rejected', () => {
  expectCode(
    () =>
      assertIsolatedPath({
        candidate: candidateA,
        purpose: 'poc',
        environment,
        child: '\\\\server\\share\\forbidden.txt',
        env,
      }),
    'UNC_PATH',
  );
});

test('device or extended-length path is rejected', () => {
  expectCode(
    () =>
      assertIsolatedPath({
        candidate: candidateA,
        purpose: 'poc',
        environment,
        child: '\\\\?\\C:\\Windows\\forbidden.txt',
        env,
      }),
    'DEVICE_OR_EXTENDED_PATH',
  );
});

test('alternate data stream is rejected', () => {
  expectCode(
    () =>
      assertIsolatedPath({
        candidate: candidateA,
        purpose: 'poc',
        environment,
        child: 'data\\probe.txt:secret',
        env,
      }),
    'ALTERNATE_DATA_STREAM',
  );
});

test('cross-candidate root is rejected', () => {
  expectCode(
    () =>
      assertIsolatedPath({
        candidate: candidateA,
        purpose: 'poc',
        environment,
        child: path.win32.join(
          bRoot,
          'data',
          'forbidden.txt',
        ),
        env,
      }),
    'CROSS_CANDIDATE_REQUEST',
  );
});

test('missing root marker is rejected', () => {
  const root = resolveApprovedRoot({
    candidate: candidateA,
    purpose: 'independent-review',
    env,
  });

  fs.mkdirSync(root, { recursive: true });

  expectCode(
    () =>
      assertIsolatedPath({
        candidate: candidateA,
        purpose: 'independent-review',
        environment,
        child: 'data\\probe.txt',
        env,
      }),
    'ROOT_MARKER_MISSING',
  );
});

test('mismatched root marker is rejected', () => {
  const root = resolveApprovedRoot({
    candidate: candidateB,
    purpose: 'independent-review',
    env,
  });

  marker(
    root,
    candidateA,
    'independent-review',
  );

  expectCode(
    () =>
      assertIsolatedPath({
        candidate: candidateB,
        purpose: 'independent-review',
        environment,
        child: 'data\\probe.txt',
        env,
      }),
    'ROOT_MARKER_MISMATCH',
  );
});

test('Junction escape is rejected', () => {
  const outside = path.join(sandbox, 'outside');
  const dataDir = path.win32.join(aRoot, 'data');
  const junction = path.win32.join(
    dataDir,
    'escape-junction',
  );

  fs.mkdirSync(outside, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });

  fs.symlinkSync(
    outside,
    junction,
    'junction',
  );

  expectCode(
    () =>
      assertIsolatedPath({
        candidate: candidateA,
        purpose: 'poc',
        environment,
        child: 'data\\escape-junction\\forbidden.txt',
        env,
      }),
    'REPARSE_ESCAPE',
  );
});

after(() => {
  fs.rmSync(sandbox, {
    recursive: true,
    force: true,
  });
});
