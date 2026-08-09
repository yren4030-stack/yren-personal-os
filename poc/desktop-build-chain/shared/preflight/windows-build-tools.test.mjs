import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateBuildToolsSnapshot,
} from './windows-build-tools.mjs';

function passingSnapshot(overrides = {}) {
  return {
    platform: 'win32',
    nodeVersion: 'v24.14.0',
    packageManager: 'pnpm@11.4.0',
    corepackAvailable: true,
    comSpecAvailable: true,
    pathExt: '.COM;.EXE;.BAT;.CMD',
    pnpmChildProcessAvailable: true,
    pnpmVersion: '11.4.0',

    tempShimWritable: true,
    userPathMutated: false,
    machinePathMutated: false,
    executionPolicyMutated: false,
    administratorRequired: false,
    tempShimCleanup: true,

    bootstrapExceptionProcessScoped: true,
    globalExoticSubdepsDisabled: false,
    bootstrapExceptionLeftBehind: false,

    publicGitHttpsAvailable: true,
    publicGitNonInteractive: true,
    pinnedCommitFetchVerified: true,
    privateSshRequiredForPublicDependencies: false,
    temporaryGitStateLeftBehind: false,

    windowsLongPathsEnabled: true,
    nodeLongPathVerified: true,
    gitLongPathEffectVerified: true,
    globalGitLongPathsRequired: false,

    tempWriteReadVerified: true,
    pnpmStoreResolved: true,
    disposableArtifactsCleaned: true,

    npmRegistryReachable: true,
    githubHttpsReachable: true,
    electronReleaseAssetReachable: true,

    candidateAHead: 'BASELINE',
    candidateBHead: 'BASELINE',
    candidateAClean: true,
    candidateBClean: true,
    candidateAPlaceholderOnly: true,
    candidateBPlaceholderOnly: true,
    isolatedCandidateStores: true,
    crossCandidateStoreReuse: false,
    sameSharedLauncher: true,

    freshShellSupported: true,
    priorDebugSessionRequired: false,
    publicDependencyPromptRequired: false,
    temporaryLauncherStateCleaned: true,
    freshShellRehearsalPassed: true,

    sharedForgeVersion: '7.11.2',
    sharedElectronVersion: '43.2.0',

    ...overrides,
  };
}

test('fully qualified snapshot passes', () => {
  const result = evaluateBuildToolsSnapshot(
    passingSnapshot(),
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.failures, []);
});

const failureCases = [
  ['BT-01', { platform: 'linux' }],
  ['BT-02', { nodeVersion: 'v22.0.0' }],
  ['BT-03', { packageManager: 'pnpm@11.20.0' }],
  ['BT-04', { corepackAvailable: false }],
  ['BT-05', { comSpecAvailable: false }],
  ['BT-06', { pathExt: '.COM;.EXE;.BAT' }],
  ['BT-07', { pnpmChildProcessAvailable: false }],
  ['BT-08', { pnpmVersion: '11.20.0' }],
  ['BT-44', { sharedForgeVersion: '7.10.0' }],
  ['BT-45', { sharedElectronVersion: '44.0.0' }],

  ['BT-09', { tempShimWritable: false }],
  ['BT-10', { userPathMutated: true }],
  ['BT-10', { machinePathMutated: true }],
  ['BT-11', { executionPolicyMutated: true }],
  ['BT-12', { administratorRequired: true }],
  ['BT-13', { tempShimCleanup: false }],

  ['BT-14', { bootstrapExceptionProcessScoped: false }],
  ['BT-15', { globalExoticSubdepsDisabled: true }],
  ['BT-16', { bootstrapExceptionLeftBehind: true }],

  ['BT-17', { publicGitHttpsAvailable: false }],
  ['BT-18', { publicGitNonInteractive: false }],
  ['BT-19', { pinnedCommitFetchVerified: false }],
  ['BT-20', { privateSshRequiredForPublicDependencies: true }],
  ['BT-21', { temporaryGitStateLeftBehind: true }],

  ['BT-22', { windowsLongPathsEnabled: false }],
  ['BT-23', { nodeLongPathVerified: false }],
  ['BT-24', { gitLongPathEffectVerified: false }],
  ['BT-25', { globalGitLongPathsRequired: true }],

  ['BT-27', { tempWriteReadVerified: false }],
  ['BT-28', { pnpmStoreResolved: false }],
  ['BT-29', { disposableArtifactsCleaned: false }],

  ['BT-30', { npmRegistryReachable: false }],
  ['BT-31', { githubHttpsReachable: false }],
  ['BT-32', { electronReleaseAssetReachable: false }],

  ['BT-33', { candidateAHead: 'A', candidateBHead: 'B' }],
  ['BT-34', { candidateAClean: false }],
  ['BT-34', { candidateBClean: false }],
  ['BT-35', { candidateAPlaceholderOnly: false }],
  ['BT-35', { candidateBPlaceholderOnly: false }],
  ['BT-36', { isolatedCandidateStores: false }],
  ['BT-37', { crossCandidateStoreReuse: true }],
  ['BT-38', { sameSharedLauncher: false }],

  ['BT-39', { freshShellSupported: false }],
  ['BT-40', { priorDebugSessionRequired: true }],
  ['BT-41', { publicDependencyPromptRequired: true }],
  ['BT-42', { temporaryLauncherStateCleaned: false }],
  ['BT-43', { freshShellRehearsalPassed: false }],
];

for (const [id, overrides] of failureCases) {
  test(`${id} fails when its required condition is violated`, () => {
    const result = evaluateBuildToolsSnapshot(
      passingSnapshot(overrides),
    );

    assert.equal(result.ok, false);
    assert.ok(
      result.failures.includes(id),
      `expected ${id}, got ${result.failures.join(', ')}`,
    );
  });
}

test('shared Electron qualification input must be 43.2.0', () => {
  const result = evaluateBuildToolsSnapshot(
    passingSnapshot({
      sharedElectronVersion: '44.0.0',
    }),
  );

  assert.equal(result.ok, false);
  assert.ok(result.failures.includes('BT-45'));
});

test('failure identifiers are unique', () => {
  const result = evaluateBuildToolsSnapshot(
    passingSnapshot({
      nodeVersion: 'v22.0.0',
      corepackAvailable: false,
    }),
  );

  assert.equal(
    new Set(result.failures).size,
    result.failures.length,
  );
});
