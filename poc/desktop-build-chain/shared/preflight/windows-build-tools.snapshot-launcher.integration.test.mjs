import test from 'node:test';
import assert from 'node:assert/strict';

import {
  collectBuildToolsSnapshot,
} from './windows-build-tools.mjs';

test(
  'qualified snapshot uses the fresh-shell launcher for pnpm',
  { timeout: 60000 },
  () => {
    const snapshot =
      collectBuildToolsSnapshot({
        repoRoot: process.cwd(),
        includeLauncherProbe: true,
      });

    assert.equal(
      typeof snapshot.rawPnpmChildProcessAvailable,
      'boolean',
      'Raw fresh-shell pnpm state must remain observable',
    );

    assert.equal(
      snapshot.pnpmChildProcessAvailable,
      true,
      'Qualified snapshot must obtain pnpm through the shared launcher',
    );

    assert.equal(
      snapshot.pnpmVersion,
      '11.4.0',
      'Qualified snapshot must resolve frozen pnpm 11.4.0',
    );

    assert.equal(
      snapshot.tempShimWritable,
      true,
      'Launcher temporary shim storage must be writable',
    );

    assert.equal(
      snapshot.tempShimCleanup,
      true,
      'Launcher temporary shim must be removed',
    );

    assert.equal(
      snapshot.bootstrapExceptionProcessScoped,
      true,
      'Forge bootstrap exception must remain child-process scoped',
    );

    assert.equal(
      snapshot.bootstrapExceptionLeftBehind,
      false,
      'Forge bootstrap exception must not remain after launcher exit',
    );

    assert.equal(
      snapshot.executionPolicyMutated,
      false,
      'Qualified snapshot must prove that Launcher does not modify ExecutionPolicy',
    );

    assert.equal(
      snapshot.administratorRequired,
      false,
      'Qualified snapshot must prove that Launcher does not require administrator elevation',
    );

    assert.equal(
      snapshot.freshShellSupported,
      true,
      'Qualified snapshot must prove that a clean fresh shell is supported',
    );

    assert.equal(
      snapshot.priorDebugSessionRequired,
      false,
      'Qualified snapshot must prove that no prior debug session is required',
    );

    assert.equal(
      snapshot.temporaryLauncherStateCleaned,
      true,
      'Qualified snapshot must prove that temporary launcher state is cleaned',
    );
  },
);
