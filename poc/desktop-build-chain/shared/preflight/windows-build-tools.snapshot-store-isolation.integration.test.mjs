import test from 'node:test';
import assert from 'node:assert/strict';

import {
  collectBuildToolsSnapshot,
  evaluateBuildToolsSnapshot,
} from './windows-build-tools.mjs';

test(
  'qualified Snapshot carries Candidate A/B store isolation evidence',
  { timeout: 120000 },
  () => {
    const snapshot =
      collectBuildToolsSnapshot({
        repoRoot: process.cwd(),
        includeCandidateStoreProbe: true,
      });

    assert.equal(
      snapshot.isolatedCandidateStores,
      true,
      'Snapshot must prove that Candidate A and B use separate qualification stores',
    );

    assert.equal(
      snapshot.crossCandidateStoreReuse,
      false,
      'Snapshot must prove that neither candidate consumes the other store',
    );

    assert.equal(
      snapshot.disposableArtifactsCleaned,
      true,
      'Candidate store qualification probe must clean its disposable artifacts',
    );

    const evaluation =
      evaluateBuildToolsSnapshot(
        snapshot,
      );

    assert.equal(
      evaluation.failures.includes('BT-36'),
      false,
      'Real Snapshot must satisfy BT-36',
    );

    assert.equal(
      evaluation.failures.includes('BT-37'),
      false,
      'Real Snapshot must satisfy BT-37',
    );
  },
);
