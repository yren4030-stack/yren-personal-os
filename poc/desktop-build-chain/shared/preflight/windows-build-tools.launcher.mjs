import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const FROZEN_PNPM = '11.4.0';

function readEnvInsensitive(env, key) {
  const entry = Object.entries(env).find(
    ([name]) =>
      name.toLowerCase() === key.toLowerCase(),
  );

  return entry?.[1];
}

function withoutEnvKey(env, key) {
  return Object.fromEntries(
    Object.entries(env).filter(
      ([name]) =>
        name.toLowerCase() !== key.toLowerCase(),
    ),
  );
}

function makeChildEnvironment({
  env,
  shimDirectory,
  forgeBootstrap,
  storeDirectory = null,
}) {
  const originalPath =
    readEnvInsensitive(env, 'PATH') ?? '';

  let childEnv =
    withoutEnvKey(env, 'PATH');

  childEnv.Path = [
    shimDirectory,
    originalPath,
  ]
    .filter(Boolean)
    .join(path.delimiter);

  childEnv = withoutEnvKey(
    childEnv,
    'pnpm_config_block_exotic_subdeps',
  );

  childEnv = withoutEnvKey(
    childEnv,
    'pnpm_config_store_dir',
  );

  if (storeDirectory) {
    childEnv.pnpm_config_store_dir =
      storeDirectory;
  }

  if (forgeBootstrap) {
    childEnv.pnpm_config_block_exotic_subdeps =
      'false';
  }

  return childEnv;
}

function runThroughCmd(
  command,
  {
    env,
    cwd,
    timeout = 30000,
  },
) {
  const comSpec =
    readEnvInsensitive(env, 'ComSpec');

  if (!comSpec) {
    return {
      ok: false,
      status: null,
      errorCode: 'COMSPEC_MISSING',
      stdout: '',
      stderr: '',
    };
  }

  const result = spawnSync(
    comSpec,
    ['/d', '/s', '/c', command],
    {
      encoding: 'utf8',
      env,
      cwd,
      timeout,
      windowsHide: true,
    },
  );

  return {
    ok:
      result.status === 0 &&
      !result.error,

    status: result.status,

    errorCode:
      result.error?.code ?? null,

    stdout:
      String(result.stdout || '').trim(),

    stderr:
      String(result.stderr || '').trim(),
  };
}

export function rehearseTemporaryPnpmShim({
  env = process.env,
  cwd = process.cwd(),
  forgeBootstrap = false,
  storeDirectory = null,
} = {}) {
  let shimDirectory = null;

  let tempShimWritable = false;
  let pnpmChildProcessAvailable = false;
  let pnpmVersion = null;
  let resolvedStorePath = null;
  let bootstrapExceptionProcessScoped = false;
  let tempShimCleanup = false;

  const parentPathBefore =
    readEnvInsensitive(env, 'PATH');

  const parentExceptionBefore =
    readEnvInsensitive(
      env,
      'pnpm_config_block_exotic_subdeps',
    );

  const parentStoreBefore =
    readEnvInsensitive(
      env,
      'pnpm_config_store_dir',
    );

  try {
    shimDirectory = fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        'yren-corepack-shims-',
      ),
    );

    tempShimWritable = true;

    const enable = runThroughCmd(
      'corepack enable pnpm --install-directory .',
      {
        env,
        cwd: shimDirectory,
        timeout: 30000,
      },
    );

    if (enable.ok) {
      const pnpmCmd = path.join(
        shimDirectory,
        'pnpm.cmd',
      );

      if (fs.existsSync(pnpmCmd)) {
        const childEnv =
          makeChildEnvironment({
            env,
            shimDirectory,
            forgeBootstrap,
            storeDirectory,
          });

        const version = runThroughCmd(
          'pnpm --version',
          {
            env: childEnv,
            cwd,
            timeout: 30000,
          },
        );

        pnpmChildProcessAvailable =
          version.ok;

        pnpmVersion =
          version.ok
            ? version.stdout
                .split(/\r?\n/)[0]
                .trim()
            : null;

        const storePath = runThroughCmd(
          'pnpm store path',
          {
            env: childEnv,
            cwd,
            timeout: 30000,
          },
        );

        resolvedStorePath =
          storePath.ok
            ? storePath.stdout
                .split(/\r?\n/)[0]
                .trim()
            : null;

        const childException =
          readEnvInsensitive(
            childEnv,
            'pnpm_config_block_exotic_subdeps',
          );

        bootstrapExceptionProcessScoped =
          forgeBootstrap
            ? (
                childException === 'false' &&
                readEnvInsensitive(
                  env,
                  'pnpm_config_block_exotic_subdeps',
                ) === parentExceptionBefore
              )
            : childException === undefined;
      }
    }
  } catch {
    // Qualification result records failure.
  } finally {
    if (shimDirectory) {
      try {
        fs.rmSync(
          shimDirectory,
          {
            recursive: true,
            force: true,
          },
        );

        tempShimCleanup =
          !fs.existsSync(shimDirectory);
      } catch {
        tempShimCleanup = false;
      }
    }
  }

  const parentPathUnchanged =
    readEnvInsensitive(env, 'PATH') ===
      parentPathBefore;

  const parentExceptionUnchanged =
    readEnvInsensitive(
      env,
      'pnpm_config_block_exotic_subdeps',
    ) === parentExceptionBefore;

  const parentStoreVariableUnchanged =
    readEnvInsensitive(
      env,
      'pnpm_config_store_dir',
    ) === parentStoreBefore;

  return {
    tempShimWritable,
    pnpmChildProcessAvailable,
    pnpmVersion,

    pnpmVersionFrozen:
      pnpmVersion === FROZEN_PNPM,

    requestedStoreDirectory:
      storeDirectory,

    resolvedStorePath,

    bootstrapExceptionProcessScoped,

    parentPathUnchanged,
    parentExceptionUnchanged,
    parentStoreVariableUnchanged,

    tempShimCleanup,
  };
}


function normalizedStorePath(value) {
  return path.resolve(value).toLowerCase();
}

function storePathIsInside(child, parent) {
  const childPath =
    normalizedStorePath(child);

  const parentPath =
    normalizedStorePath(parent);

  return (
    childPath === parentPath ||
    childPath.startsWith(
      parentPath + path.sep,
    )
  );
}

export function rehearseCandidateStoreIsolation({
  env = process.env,
  cwd = process.cwd(),
} = {}) {
  const probeRoot =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        'yren-candidate-store-isolation-',
      ),
    );

  const storeA =
    path.join(
      probeRoot,
      'candidate-a',
    );

  const storeB =
    path.join(
      probeRoot,
      'candidate-b',
    );

  let candidateA = null;
  let candidateB = null;
  let isolatedCandidateStores = false;
  let crossCandidateStoreReuse = null;
  let probeCleaned = false;

  try {
    candidateA =
      rehearseTemporaryPnpmShim({
        env,
        cwd,
        forgeBootstrap: true,
        storeDirectory: storeA,
      });

    candidateB =
      rehearseTemporaryPnpmShim({
        env,
        cwd,
        forgeBootstrap: true,
        storeDirectory: storeB,
      });

    const resolvedA =
      candidateA.resolvedStorePath;

    const resolvedB =
      candidateB.resolvedStorePath;

    const storesObservable =
      typeof resolvedA === 'string' &&
      typeof resolvedB === 'string';

    if (storesObservable) {
      const aInsideA =
        storePathIsInside(
          resolvedA,
          storeA,
        );

      const bInsideB =
        storePathIsInside(
          resolvedB,
          storeB,
        );

      const aInsideB =
        storePathIsInside(
          resolvedA,
          storeB,
        );

      const bInsideA =
        storePathIsInside(
          resolvedB,
          storeA,
        );

      const sameResolvedStore =
        normalizedStorePath(resolvedA) ===
        normalizedStorePath(resolvedB);

      isolatedCandidateStores =
        candidateA.pnpmChildProcessAvailable === true &&
        candidateB.pnpmChildProcessAvailable === true &&
        candidateA.pnpmVersionFrozen === true &&
        candidateB.pnpmVersionFrozen === true &&
        candidateA.parentStoreVariableUnchanged === true &&
        candidateB.parentStoreVariableUnchanged === true &&
        aInsideA &&
        bInsideB &&
        !sameResolvedStore;

      crossCandidateStoreReuse =
        aInsideB ||
        bInsideA ||
        sameResolvedStore;
    }
  }
  finally {
    fs.rmSync(
      probeRoot,
      {
        recursive: true,
        force: true,
      },
    );

    probeCleaned =
      !fs.existsSync(probeRoot);
  }

  return {
    isolatedCandidateStores,
    crossCandidateStoreReuse,

    candidateARequestedStore:
      storeA,

    candidateBRequestedStore:
      storeB,

    candidateAResolvedStore:
      candidateA?.resolvedStorePath ?? null,

    candidateBResolvedStore:
      candidateB?.resolvedStorePath ?? null,

    candidateA,
    candidateB,

    probeCleaned,
  };
}

function windowsPowerShellPath({
  env = process.env,
} = {}) {
  const systemRoot =
    readEnvInsensitive(env, 'SystemRoot') ||
    readEnvInsensitive(env, 'WINDIR');

  if (!systemRoot) {
    return null;
  }

  return path.join(
    systemRoot,
    'System32',
    'WindowsPowerShell',
    'v1.0',
    'powershell.exe',
  );
}

function runPowerShellReadOnly(
  script,
  {
    env = process.env,
    timeout = 15000,
  } = {},
) {
  const executable =
    windowsPowerShellPath({ env });

  if (!executable) {
    return {
      ok: false,
      stdout: '',
      stderr: '',
    };
  }

  const result = spawnSync(
    executable,
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      script,
    ],
    {
      encoding: 'utf8',
      env,
      timeout,
      windowsHide: true,
    },
  );

  return {
    ok:
      result.status === 0 &&
      !result.error,

    stdout:
      String(result.stdout || '').trim(),

    stderr:
      String(result.stderr || '').trim(),
  };
}

function readExecutionPolicySnapshot({
  env = process.env,
} = {}) {
  const result = runPowerShellReadOnly(
    `
$list = Get-ExecutionPolicy -List
[pscustomobject]@{
  Effective = (Get-ExecutionPolicy).ToString()
  Scopes = @(
    $list | ForEach-Object {
      "$($_.Scope)=$($_.ExecutionPolicy)"
    }
  )
} | ConvertTo-Json -Compress
`,
    { env },
  );

  if (!result.ok) {
    return null;
  }

  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}

function readAdministratorStatus({
  env = process.env,
} = {}) {
  const result = runPowerShellReadOnly(
    `
$principal = New-Object Security.Principal.WindowsPrincipal(
  [Security.Principal.WindowsIdentity]::GetCurrent()
)

if (
  $principal.IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
  )
) {
  'true'
}
else {
  'false'
}
`,
    { env },
  );

  if (!result.ok) {
    return null;
  }

  if (result.stdout === 'true') {
    return true;
  }

  if (result.stdout === 'false') {
    return false;
  }

  return null;
}


function observePriorDebugSessionState({
  env = process.env,
} = {}) {
  const pathValue =
    readEnvInsensitive(env, 'PATH') ?? '';

  const hasTempShim =
    pathValue
      .toLowerCase()
      .includes('yren-corepack-shims');

  const hasPnpmException =
    readEnvInsensitive(
      env,
      'pnpm_config_block_exotic_subdeps',
    ) !== undefined;

  const hasSshAuthSock =
    readEnvInsensitive(
      env,
      'SSH_AUTH_SOCK',
    ) !== undefined;

  const hasSshAgentPid =
    readEnvInsensitive(
      env,
      'SSH_AGENT_PID',
    ) !== undefined;

  return {
    hasTempShim,
    hasPnpmException,
    hasSshAuthSock,
    hasSshAgentPid,

    priorDebugStatePresent:
      hasTempShim ||
      hasPnpmException ||
      hasSshAuthSock ||
      hasSshAgentPid,
  };
}

export function rehearseLauncherPolicy({
  env = process.env,
  cwd = process.cwd(),
} = {}) {
  const priorDebugState =
    observePriorDebugSessionState({
      env,
    });

  const before =
    readExecutionPolicySnapshot({ env });

  const administrator =
    readAdministratorStatus({ env });

  const launcher =
    rehearseTemporaryPnpmShim({
      env,
      cwd,
      forgeBootstrap: true,
    });

  const after =
    readExecutionPolicySnapshot({ env });

  const launcherSucceeded =
    launcher.pnpmChildProcessAvailable === true &&
    launcher.pnpmVersionFrozen === true &&
    launcher.tempShimCleanup === true;

  const freshShellSupported =
    priorDebugState.priorDebugStatePresent === false
      ? launcherSucceeded
      : null;

  const priorDebugSessionRequired =
    priorDebugState.priorDebugStatePresent === false &&
    launcherSucceeded
      ? false
      : null;

  const temporaryLauncherStateCleaned =
    launcher.tempShimCleanup === true &&
    launcher.parentPathUnchanged === true &&
    launcher.parentExceptionUnchanged === true &&
    launcher.parentStoreVariableUnchanged === true;

  const executionPolicyMutated =
    before !== null &&
    after !== null
      ? JSON.stringify(before) !==
          JSON.stringify(after)
      : null;

  const administratorRequired =
    administrator === false &&
    launcherSucceeded
      ? false
      : administrator === true
        ? null
        : null;

  return {
    launcher,

    priorDebugState,
    freshShellSupported,
    priorDebugSessionRequired,
    temporaryLauncherStateCleaned,

    administratorObserved:
      administrator,

    administratorRequired,

    executionPolicyBefore:
      before,

    executionPolicyAfter:
      after,

    executionPolicyMutated,
  };
}

export {
  FROZEN_PNPM,
};
