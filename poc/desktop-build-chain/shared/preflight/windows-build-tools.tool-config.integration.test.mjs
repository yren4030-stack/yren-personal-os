import test from 'node:test';
import assert from 'node:assert/strict';

import {
  collectBuildToolsSnapshot,
} from './windows-build-tools.mjs';

test(
  'persistent Git and pnpm configuration satisfies the shared contract',
  () => {
    const snapshot = collectBuildToolsSnapshot({
      repoRoot: process.cwd(),
    });

    assert.equal(
      snapshot.globalGitLongPathsRequired,
      false,
      'Git long-path support must not depend on global core.longpaths=true',
    );

    assert.equal(
      snapshot.globalExoticSubdepsDisabled,
      false,
      'pnpm blockExoticSubdeps must not be persistently disabled',
    );

    assert.equal(
      snapshot.disposableArtifactsCleaned,
      true,
      'Persistent configuration probes must clean temporary artifacts',
    );
  },
);
