import test from 'node:test';
import assert from 'node:assert/strict';

import {
  rehearseCandidateStoreIsolation,
} from './windows-build-tools.launcher.mjs';

test(
  'Candidate A and B qualification stores are isolated and child-process scoped',
  { timeout: 120000 },
  () => {
    const result =
      rehearseCandidateStoreIsolation({
        cwd: process.cwd(),
      });

    assert.equal(
      result.isolatedCandidateStores,
      true,
      'Candidate A and B must resolve to separate qualification stores',
    );

    assert.equal(
      result.crossCandidateStoreReuse,
      false,
      'Neither candidate may consume the other candidate qualification store',
    );

    assert.equal(
      typeof result.candidateAResolvedStore,
      'string',
    );

    assert.equal(
      typeof result.candidateBResolvedStore,
      'string',
    );

    assert.notEqual(
      result.candidateAResolvedStore.toLowerCase(),
      result.candidateBResolvedStore.toLowerCase(),
      'Candidate A and B resolved stores must differ',
    );

    assert.equal(
      result.candidateA?.parentStoreVariableUnchanged,
      true,
      'Candidate A rehearsal must not mutate the parent store variable',
    );

    assert.equal(
      result.candidateB?.parentStoreVariableUnchanged,
      true,
      'Candidate B rehearsal must not mutate the parent store variable',
    );

    assert.equal(
      result.candidateA?.tempShimCleanup,
      true,
    );

    assert.equal(
      result.candidateB?.tempShimCleanup,
      true,
    );

    assert.equal(
      result.probeCleaned,
      true,
      'Store-isolation rehearsal must remove its temporary probe root',
    );
  },
);
