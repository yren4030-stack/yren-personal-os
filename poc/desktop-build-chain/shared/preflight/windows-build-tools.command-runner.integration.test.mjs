import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { runPnpmThroughSharedLauncher } from './windows-build-tools.launcher.mjs';

test('real pnpm command uses the shared child environment', { timeout: 60000 }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yren-shared-runner-'));
  const storeDirectory = path.join(root, 'store');
  const probe = path.join(root, 'probe.mjs');
  const parentEnv = {
    ...process.env,
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'safe.directory',
    GIT_CONFIG_VALUE_0: 'F:/existing-safe-directory',
  };
  const promptBefore = parentEnv.GIT_TERMINAL_PROMPT;

  try {
    fs.writeFileSync(
      probe,
      "console.log(JSON.stringify({prompt:process.env.GIT_TERMINAL_PROMPT,count:process.env.GIT_CONFIG_COUNT,key0:process.env.GIT_CONFIG_KEY_0,store:process.env.pnpm_config_store_dir,exotic:process.env.pnpm_config_block_exotic_subdeps}))\n",
      'utf8',
    );

    const result = runPnpmThroughSharedLauncher({
      env: parentEnv,
      cwd: process.cwd(),
      forgeBootstrap: true,
      storeDirectory,
      pnpmArguments: ['exec', 'node', probe],
    });

    assert.equal(result.ok, true, result.stderr);
    const observed = JSON.parse(result.stdout.split(/\r?\n/).filter(Boolean).at(-1));
    assert.equal(observed.prompt, '0');
    assert.ok(Number(observed.count) > 1);
    assert.equal(observed.key0, 'safe.directory');
    assert.equal(path.resolve(observed.store), path.resolve(storeDirectory));
    assert.equal(observed.exotic, 'false');
    assert.equal(result.tempShimCleanup, true);
    assert.equal(parentEnv.GIT_TERMINAL_PROMPT, promptBefore);
    assert.equal(parentEnv.GIT_CONFIG_COUNT, '1');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
