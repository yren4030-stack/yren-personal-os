import test from 'node:test';
import assert from 'node:assert/strict';

import {
  collectBuildToolsSnapshot,
  evaluateBuildToolsSnapshot,
} from './windows-build-tools.mjs';

test(
  'post-merge Candidate fairness snapshot proves BT-33 through BT-38',
  () => {
    const snapshot =
      collectBuildToolsSnapshot({
        repoRoot: process.cwd(),
        includeCandidateFairnessProbe: true,
      });

    assert.equal(
      typeof snapshot.candidateAHead,
      'string',
    );

    assert.equal(
      typeof snapshot.candidateBHead,
      'string',
    );

    assert.equal(
      snapshot.candidateAHead,
      snapshot.candidateBHead,
      'Candidate A and B must start from the same Git commit',
    );

    assert.equal(
      snapshot.candidateAClean,
      true,
      'Candidate A worktree must be clean',
    );

    assert.equal(
      snapshot.candidateBClean,
      true,
      'Candidate B worktree must be clean',
    );

    assert.equal(
      snapshot.candidateAPlaceholderOnly,
      true,
      'Candidate A directory must remain placeholder-only',
    );

    assert.equal(
      snapshot.candidateBPlaceholderOnly,
      true,
      'Candidate B directory must remain placeholder-only',
    );

    assert.equal(
      snapshot.sameSharedLauncher,
      true,
      'After remediation merge and A/B resync, both candidates must use the same shared launcher and preflight',
    );

    const evaluation =
      evaluateBuildToolsSnapshot(
        snapshot,
      );

    assert.equal(
      evaluation.failures.includes('BT-33'),
      false,
    );

    assert.equal(
      evaluation.failures.includes('BT-34'),
      false,
    );

    assert.equal(
      evaluation.failures.includes('BT-35'),
      false,
    );

    assert.equal(
      evaluation.failures.includes('BT-38'),
      false,
      'BT-38 must pass after remediation merge and A/B resync',
    );
  },
);
