import test from 'node:test';
import assert from 'node:assert/strict';

import {
  rehearseLauncherPolicy,
} from './windows-build-tools.launcher.mjs';

test(
  'fresh-shell launcher needs no administrator and does not mutate ExecutionPolicy',
  { timeout: 60000 },
  () => {
    const result =
      rehearseLauncherPolicy({
        cwd: process.cwd(),
      });

    assert.equal(
      result.administratorObserved,
      false,
      'Qualification rehearsal must run from a non-administrator shell',
    );

    assert.equal(
      result.administratorRequired,
      false,
      'Shared launcher must not require administrator elevation',
    );

    assert.notEqual(
      result.executionPolicyBefore,
      null,
      'ExecutionPolicy before-state must be observable',
    );

    assert.notEqual(
      result.executionPolicyAfter,
      null,
      'ExecutionPolicy after-state must be observable',
    );

    assert.equal(
      result.executionPolicyMutated,
      false,
      'Launcher must not modify any PowerShell ExecutionPolicy scope',
    );

    assert.equal(
      result.freshShellSupported,
      true,
      'A clean fresh shell must be supported by the shared launcher',
    );

    assert.equal(
      result.priorDebugSessionRequired,
      false,
      'Launcher qualification must not depend on a prior debug session',
    );

    assert.equal(
      result.temporaryLauncherStateCleaned,
      true,
      'Temporary launcher state must be cleaned after rehearsal',
    );

    assert.equal(
      result.launcher.pnpmChildProcessAvailable,
      true,
    );

    assert.equal(
      result.launcher.pnpmVersionFrozen,
      true,
    );

    assert.equal(
      result.launcher.tempShimCleanup,
      true,
    );
  },
);
