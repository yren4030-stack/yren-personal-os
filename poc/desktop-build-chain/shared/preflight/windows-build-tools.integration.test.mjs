import test from 'node:test';
import assert from 'node:assert/strict';

import {
  collectBuildToolsSnapshot,
} from './windows-build-tools.mjs';

test('runtime probe batch 1 observes the raw Windows baseline', () => {
  const snapshot = collectBuildToolsSnapshot({
    repoRoot: process.cwd(),
  });

  assert.equal(snapshot.platform, 'win32');
  assert.equal(snapshot.nodeVersion, 'v24.14.0');

  assert.match(
    snapshot.packageManager ?? '',
    /^pnpm@11\.4\.0(?:\+|$)/,
  );

  assert.equal(snapshot.corepackAvailable, true);
  assert.equal(snapshot.comSpecAvailable, true);

  assert.ok(
    snapshot.pathExt
      .split(';')
      .map((item) => item.trim().toUpperCase())
      .includes('.CMD'),
  );

  assert.equal(
    typeof snapshot.pnpmChildProcessAvailable,
    'boolean',
  );

  if (snapshot.pnpmChildProcessAvailable) {
    assert.equal(
      typeof snapshot.pnpmVersion,
      'string',
    );
  } else {
    assert.equal(
      snapshot.pnpmVersion,
      null,
    );
  }

  assert.equal(
    snapshot.tempWriteReadVerified,
    true,
  );

  assert.equal(
    snapshot.disposableArtifactsCleaned,
    true,
  );

  assert.equal(snapshot.pnpmStoreResolved, true);
});
