import test from 'node:test';
import assert from 'node:assert/strict';

import {
  collectBuildToolsSnapshot,
  evaluateBuildToolsSnapshot,
} from './windows-build-tools.mjs';

test(
  'shared frozen-version manifest supplies BT-44 and BT-45 qualification inputs',
  () => {
    const snapshot =
      collectBuildToolsSnapshot({
        repoRoot: process.cwd(),
      });

    assert.equal(
      snapshot.sharedForgeVersion,
      '7.11.2',
      'Shared Forge qualification input must come from the version manifest',
    );

    assert.equal(
      snapshot.sharedElectronVersion,
      '43.2.0',
      'Shared Electron qualification input must come from the version manifest',
    );

    const evaluation =
      evaluateBuildToolsSnapshot(
        snapshot,
      );

    assert.equal(
      evaluation.failures.includes('BT-44'),
      false,
      'Real Snapshot must satisfy BT-44',
    );

    assert.equal(
      evaluation.failures.includes('BT-45'),
      false,
      'Real Snapshot must satisfy BT-45',
    );
  },
);
