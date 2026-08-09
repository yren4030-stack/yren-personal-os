import test from 'node:test';
import assert from 'node:assert/strict';

import {
  collectBuildToolsSnapshot,
} from './windows-build-tools.mjs';

test(
  'persistent Windows state satisfies the shared build-tools contract',
  () => {
    const snapshot = collectBuildToolsSnapshot({
      repoRoot: process.cwd(),
    });

    assert.equal(
      snapshot.windowsLongPathsEnabled,
      true,
      'Windows LongPathsEnabled must be enabled',
    );

    assert.equal(
      snapshot.userPathMutated,
      false,
      'Temporary Corepack shim must not persist in User PATH',
    );

    assert.equal(
      snapshot.machinePathMutated,
      false,
      'Temporary Corepack shim must not persist in Machine PATH',
    );
  },
);
