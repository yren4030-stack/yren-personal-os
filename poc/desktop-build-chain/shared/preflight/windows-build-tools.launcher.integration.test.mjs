import test from 'node:test';
import assert from 'node:assert/strict';

import {
  rehearseTemporaryPnpmShim,
} from './windows-build-tools.launcher.mjs';

test(
  'fresh-shell launcher provides frozen pnpm through a disposable shim',
  { timeout: 60000 },
  () => {
    const result = rehearseTemporaryPnpmShim({
      cwd: process.cwd(),
      forgeBootstrap: false,
    });

    assert.equal(
      result.tempShimWritable,
      true,
      'Launcher must create its shim in writable temporary storage',
    );

    assert.equal(
      result.pnpmChildProcessAvailable,
      true,
      'pnpm must become available to launcher child processes',
    );

    assert.equal(
      result.pnpmVersion,
      '11.4.0',
      'Launcher must resolve exactly pnpm 11.4.0',
    );

    assert.equal(
      result.pnpmVersionFrozen,
      true,
    );

    assert.equal(
      result.parentPathUnchanged,
      true,
      'Launcher must not mutate the parent shell PATH',
    );

    assert.equal(
      result.parentExceptionUnchanged,
      true,
      'Launcher must not mutate the parent pnpm security exception',
    );

    assert.equal(
      result.tempShimCleanup,
      true,
      'Temporary Corepack shim must be removed after rehearsal',
    );
  },
);

test(
  'Forge bootstrap exception is child-process scoped and cleaned',
  { timeout: 60000 },
  () => {
    const result = rehearseTemporaryPnpmShim({
      cwd: process.cwd(),
      forgeBootstrap: true,
    });

    assert.equal(
      result.pnpmChildProcessAvailable,
      true,
    );

    assert.equal(
      result.pnpmVersionFrozen,
      true,
    );

    assert.equal(
      result.bootstrapExceptionProcessScoped,
      true,
      'blockExoticSubdeps=false must exist only in the launcher child environment',
    );

    assert.equal(
      result.parentPathUnchanged,
      true,
    );

    assert.equal(
      result.parentExceptionUnchanged,
      true,
    );

    assert.equal(
      result.tempShimCleanup,
      true,
    );
  },
);
