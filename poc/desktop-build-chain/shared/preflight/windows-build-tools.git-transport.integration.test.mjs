import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

import {
  makePublicGitHttpsEnvironment,
} from './windows-build-tools.launcher.mjs';

test(
  'shared launcher rewrites the escaped public GitHub SSH URL to HTTPS',
  () => {
    const parentEnv = {
      ...process.env,
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'safe.directory',
      GIT_CONFIG_VALUE_0: 'F:/existing-safe-directory',
    };

    const childEnv =
      makePublicGitHttpsEnvironment(parentEnv);

    assert.equal(
      childEnv.GIT_TERMINAL_PROMPT,
      '0',
      'Public Git operations must be noninteractive',
    );

    assert.equal(
      childEnv.GIT_CONFIG_KEY_0,
      'safe.directory',
      'Existing process-scoped Git config must be preserved',
    );

    assert.equal(
      childEnv.GIT_CONFIG_VALUE_0,
      'F:/existing-safe-directory',
      'Existing process-scoped Git config value must be preserved',
    );

    assert.ok(
      Number(childEnv.GIT_CONFIG_COUNT) > 1,
      'Shared transport rules must append to inherited Git config',
    );

    const escapedUrl =
      'git+ssh://git@github.com/electron/node-gyp.git';

    const resolved = spawnSync(
      'git',
      [
        'ls-remote',
        '--get-url',
        escapedUrl,
      ],
      {
        encoding: 'utf8',
        env: childEnv,
        windowsHide: true,
      },
    );

    assert.equal(
      resolved.status,
      0,
      resolved.stderr,
    );

    assert.equal(
      String(resolved.stdout || '').trim(),
      'https://github.com/electron/node-gyp.git',
      'The real pnpm escaped URL must resolve to public HTTPS',
    );

    assert.equal(
      parentEnv.GIT_CONFIG_COUNT,
      '1',
      'Parent Git configuration must remain unchanged',
    );

    assert.equal(
      parentEnv.GIT_TERMINAL_PROMPT,
      process.env.GIT_TERMINAL_PROMPT,
      'Parent prompt policy must remain unchanged',
    );
  },
);
