import test from 'node:test';
import assert from 'node:assert/strict';

import {
  collectBuildToolsSnapshot,
} from './windows-build-tools.mjs';

test(
  'runtime effect probes verify long paths and pinned public Git dependency',
  { timeout: 90000 },
  () => {
    const snapshot = collectBuildToolsSnapshot({
      repoRoot: process.cwd(),
      includeEffectProbes: true,
      includeNetworkProbe: true,
    });

    assert.equal(
      snapshot.nodeLongPathVerified,
      true,
      'Node must perform real I/O beyond 260 characters',
    );

    assert.equal(
      snapshot.gitLongPathEffectVerified,
      true,
      'Git must actually stage a long-path file',
    );

    assert.equal(
      snapshot.publicGitHttpsAvailable,
      true,
      'Pinned public Git dependency must be fetchable over HTTPS',
    );

    assert.equal(
      snapshot.publicGitNonInteractive,
      true,
      'Pinned public Git dependency must be fetchable non-interactively',
    );

    assert.equal(
      snapshot.pinnedCommitFetchVerified,
      true,
      'FETCH_HEAD must equal the required pinned commit',
    );

    assert.equal(
      snapshot.privateSshRequiredForPublicDependencies,
      false,
      'Public build dependencies must not require a private SSH identity',
    );

    assert.equal(
      snapshot.temporaryGitStateLeftBehind,
      false,
      'Temporary Git state must be removed',
    );

    assert.equal(
      snapshot.disposableArtifactsCleaned,
      true,
      'All disposable probe artifacts must be removed',
    );
  },
);
