
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import {
  makePublicGitHttpsEnvironment,
  rehearseCandidateStoreIsolation,
  rehearseLauncherPolicy,
} from './windows-build-tools.launcher.mjs';

function runThroughCmd(command, {
  env = process.env,
  timeout = 15000,
  cwd = process.cwd(),
} = {}) {
  const comSpec = env.ComSpec;

  if (!comSpec) {
    return {
      ok: false,
      status: null,
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
      timeout,
      cwd,
      windowsHide: true,
    },
  );

  return {
    ok: result.status === 0 && !result.error,
    status: result.status,
    stdout: String(result.stdout || '').trim(),
    stderr: String(result.stderr || '').trim(),
  };
}

function readPackageManager(repoRoot) {
  try {
    const packageJsonPath = path.join(
      repoRoot,
      'package.json',
    );

    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf8'),
    );

    return packageJson.packageManager ?? null;
  } catch {
    return null;
  }
}

function readSharedQualificationVersions(repoRoot) {
  try {
    const manifestPath = path.join(
      repoRoot,
      'poc',
      'desktop-build-chain',
      'shared',
      'preflight',
      'windows-build-tools.shared-versions.json',
    );

    const manifestText =
      fs.readFileSync(
        manifestPath,
        'utf8',
      )
        .replace(/^\uFEFF/, '');

    const manifest =
      JSON.parse(manifestText);

    if (manifest.schemaVersion !== 1) {
      return {
        forge: null,
        electron: null,
      };
    }

    return {
      forge:
        typeof manifest.electronForge === 'string'
          ? manifest.electronForge
          : null,

      electron:
        typeof manifest.electron === 'string'
          ? manifest.electron
          : null,
    };
  } catch {
    return {
      forge: null,
      electron: null,
    };
  }
}

function probeTemporaryStorage() {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), 'yren-preflight-temp-'),
  );

  const file = path.join(root, 'probe.txt');

  let verified = false;
  let cleaned = false;

  try {
    fs.writeFileSync(file, 'probe', 'utf8');

    verified =
      fs.readFileSync(file, 'utf8') === 'probe';
  } catch {
    verified = false;
  } finally {
    try {
      fs.rmSync(root, {
        recursive: true,
        force: true,
      });

      cleaned = !fs.existsSync(root);
    } catch {
      cleaned = false;
    }
  }

  return {
    verified,
    cleaned,
  };
}


const NODE_GYP_REPOSITORY =
  'git+ssh://git@github.com/electron/node-gyp.git';

const NODE_GYP_COMMIT =
  '06b29aafb7708acef8b3669835c8a7857ebc92d2';

function probeNodeLongPath() {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), 'yren-node-longpath-'),
  );

  let verified = false;
  let cleaned = false;

  try {
    let directory = root;

    while (directory.length < 300) {
      directory = path.join(
        directory,
        'segment-1234567890',
      );
    }

    const file = path.join(
      directory,
      'probe.txt',
    );

    fs.mkdirSync(directory, {
      recursive: true,
    });

    fs.writeFileSync(
      file,
      'probe',
      'utf8',
    );

    verified =
      file.length > 260 &&
      fs.readFileSync(file, 'utf8') === 'probe';
  } catch {
    verified = false;
  } finally {
    try {
      fs.rmSync(root, {
        recursive: true,
        force: true,
      });

      cleaned = !fs.existsSync(root);
    } catch {
      cleaned = false;
    }
  }

  return {
    verified,
    cleaned,
  };
}


function probeGitLongPathEffect({
  env = process.env,
} = {}) {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), 'yren-git-longpath-'),
  );

  let verified = false;
  let cleaned = false;

  try {
    const init = spawnSync(
      'git',
      ['-C', root, 'init', '--quiet'],
      {
        encoding: 'utf8',
        env,
        timeout: 15000,
        windowsHide: true,
      },
    );

    if (init.status !== 0 || init.error) {
      throw new Error('git long-path probe init failed');
    }

    let directory = root;

    while (directory.length < 300) {
      directory = path.join(
        directory,
        'segment-1234567890',
      );
    }

    const file = path.join(
      directory,
      'probe.txt',
    );

    fs.mkdirSync(directory, {
      recursive: true,
    });

    fs.writeFileSync(
      file,
      'probe',
      'utf8',
    );

    const add = spawnSync(
      'git',
      [
        '-C',
        root,
        '-c',
        'core.longpaths=true',
        'add',
        '.',
      ],
      {
        encoding: 'utf8',
        env,
        timeout: 15000,
        windowsHide: true,
      },
    );

    if (add.status !== 0 || add.error) {
      throw new Error('git long-path probe add failed');
    }

    const listed = spawnSync(
      'git',
      [
        '-C',
        root,
        '-c',
        'core.longpaths=true',
        'ls-files',
        '-z',
      ],
      {
        encoding: 'utf8',
        env,
        timeout: 15000,
        windowsHide: true,
      },
    );

    if (listed.status === 0 && !listed.error) {
      const files = String(listed.stdout || '')
        .split('\0')
        .filter(Boolean);

      verified =
        file.length > 260 &&
        files.length === 1 &&
        files[0].endsWith('probe.txt');
    }
  } catch {
    verified = false;
  } finally {
    try {
      fs.rmSync(root, {
        recursive: true,
        force: true,
      });

      cleaned = !fs.existsSync(root);
    } catch {
      cleaned = false;
    }
  }

  return {
    verified,
    cleaned,
  };
}

function probePinnedGitDependency({
  env = process.env,
} = {}) {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), 'yren-git-fetch-'),
  );

  let httpsAvailable = false;
  let nonInteractive = false;
  let commitVerified = false;
  let cleaned = false;

  const gitEnv =
    makePublicGitHttpsEnvironment(env);

  try {
    const init = spawnSync(
      'git',
      ['-C', root, 'init', '--quiet'],
      {
        encoding: 'utf8',
        env: gitEnv,
        timeout: 15000,
        windowsHide: true,
      },
    );

    if (init.status !== 0 || init.error) {
      throw new Error('pinned Git dependency probe init failed');
    }

    const fetch = spawnSync(
      'git',
      [
        '-C',
        root,
        '-c',
        'core.longpaths=true',
        'fetch',
        '--depth',
        '1',
        NODE_GYP_REPOSITORY,
        NODE_GYP_COMMIT,
      ],
      {
        encoding: 'utf8',
        env: gitEnv,
        timeout: 60000,
        windowsHide: true,
      },
    );

    httpsAvailable =
      fetch.status === 0 &&
      !fetch.error;

    nonInteractive = httpsAvailable;

    if (httpsAvailable) {
      const verify = spawnSync(
        'git',
        [
          '-C',
          root,
          'rev-parse',
          'FETCH_HEAD',
        ],
        {
          encoding: 'utf8',
          env: gitEnv,
          timeout: 15000,
          windowsHide: true,
        },
      );

      commitVerified =
        verify.status === 0 &&
        !verify.error &&
        String(verify.stdout || '').trim() ===
          NODE_GYP_COMMIT;
    }
  } catch {
    httpsAvailable = false;
    nonInteractive = false;
    commitVerified = false;
  } finally {
    try {
      fs.rmSync(root, {
        recursive: true,
        force: true,
      });

      cleaned = !fs.existsSync(root);
    } catch {
      cleaned = false;
    }
  }

  return {
    httpsAvailable,
    nonInteractive,
    commitVerified,
    cleaned,
  };
}


function queryPersistentPath(
  scope,
  { env = process.env } = {},
) {
  const systemRoot =
    env.SystemRoot ||
    env.WINDIR;

  if (!systemRoot) {
    return {
      ok: false,
      value: '',
    };
  }

  const powershell = path.join(
    systemRoot,
    'System32',
    'WindowsPowerShell',
    'v1.0',
    'powershell.exe',
  );

  const result = spawnSync(
    powershell,
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `[Environment]::GetEnvironmentVariable('Path','${scope}')`,
    ],
    {
      encoding: 'utf8',
      env,
      timeout: 15000,
      windowsHide: true,
    },
  );

  return {
    ok:
      result.status === 0 &&
      !result.error,
    value:
      String(result.stdout || '').trim(),
  };
}

function probeWindowsPersistentState({
  env = process.env,
} = {}) {
  const systemRoot =
    env.SystemRoot ||
    env.WINDIR;

  let windowsLongPathsEnabled = null;

  if (systemRoot) {
    const regExe = path.join(
      systemRoot,
      'System32',
      'reg.exe',
    );

    const registry = spawnSync(
      regExe,
      [
        'query',
        'HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem',
        '/v',
        'LongPathsEnabled',
      ],
      {
        encoding: 'utf8',
        env,
        timeout: 15000,
        windowsHide: true,
      },
    );

    const registryReadable =
      registry.status === 0 &&
      !registry.error;

    if (registryReadable) {
      const registryOutput =
        String(registry.stdout || '');

      windowsLongPathsEnabled =
        /LongPathsEnabled\s+REG_DWORD\s+0x1\b/i
          .test(registryOutput);
    }
  }

  const userPath = queryPersistentPath(
    'User',
    { env },
  );

  const machinePath = queryPersistentPath(
    'Machine',
    { env },
  );

  const containsTempShim = (value) =>
    value
      .toLowerCase()
      .includes('yren-corepack-shims');

  return {
    windowsLongPathsEnabled,

    userPathMutated:
      userPath.ok
        ? containsTempShim(userPath.value)
        : null,

    machinePathMutated:
      machinePath.ok
        ? containsTempShim(machinePath.value)
        : null,
  };
}


function probePersistentToolConfiguration({
  env = process.env,
} = {}) {
  const git = spawnSync(
    'git',
    [
      'config',
      '--global',
      '--get',
      'core.longpaths',
    ],
    {
      encoding: 'utf8',
      env,
      timeout: 15000,
      windowsHide: true,
    },
  );

  const gitValue =
    String(git.stdout || '')
      .trim()
      .toLowerCase();

  const globalGitLongPathsRequired =
    git.status === 0
      ? gitValue === 'true'
      : git.status === 1 &&
          !git.error
        ? false
        : null;

  const probeRoot = fs.mkdtempSync(
    path.join(
      os.tmpdir(),
      'yren-pnpm-config-',
    ),
  );

  let globalExoticSubdepsDisabled = null;
  let cleaned = false;

  const pnpmEnv = {
    ...env,
  };

  delete pnpmEnv.pnpm_config_block_exotic_subdeps;
  delete pnpmEnv.PNPM_CONFIG_BLOCK_EXOTIC_SUBDEPS;

  try {
    const pnpmConfig = runThroughCmd(
      'corepack pnpm config get blockExoticSubdeps',
      {
        env: pnpmEnv,
        timeout: 15000,
        cwd: probeRoot,
      },
    );

    if (pnpmConfig.ok) {
      const value =
        pnpmConfig.stdout
          .trim()
          .toLowerCase();

      if (
        value === 'undefined' ||
        value === 'true'
      ) {
        globalExoticSubdepsDisabled = false;
      } else if (value === 'false') {
        globalExoticSubdepsDisabled = true;
      }
    }
  } finally {
    try {
      fs.rmSync(probeRoot, {
        recursive: true,
        force: true,
      });

      cleaned = !fs.existsSync(probeRoot);
    } catch {
      cleaned = false;
    }
  }

  return {
    globalGitLongPathsRequired,
    globalExoticSubdepsDisabled,
    persistentConfigProbeCleaned: cleaned,
  };
}

function parseWorktreePorcelain(output) {
  const blocks =
    String(output || '')
      .trim()
      .split(/\r?\n\r?\n+/)
      .filter(Boolean);

  return blocks.map((block) => {
    const result = {
      worktree: null,
      head: null,
      branch: null,
    };

    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('worktree ')) {
        result.worktree =
          line.slice('worktree '.length);
      }
      else if (line.startsWith('HEAD ')) {
        result.head =
          line.slice('HEAD '.length);
      }
      else if (line.startsWith('branch ')) {
        result.branch =
          line.slice('branch '.length);
      }
    }

    return result;
  });
}

function runGitReadOnly(
  args,
  {
    env = process.env,
    timeout = 15000,
  } = {},
) {
  const result = spawnSync(
    'git',
    args,
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

function filesEqual(left, right) {
  try {
    return fs
      .readFileSync(left)
      .equals(
        fs.readFileSync(right),
      );
  }
  catch {
    return false;
  }
}

function inspectCandidateWorktree({
  worktree,
  relativeCandidateDirectory,
  env,
}) {
  if (!worktree) {
    return {
      clean: false,
      placeholderOnly: false,
    };
  }

  const status =
    runGitReadOnly(
      [
        '-C',
        worktree,
        'status',
        '--porcelain',
      ],
      { env },
    );

  const candidateDirectory =
    path.join(
      worktree,
      relativeCandidateDirectory,
    );

  let placeholderOnly = false;

  try {
    const entries =
      fs.readdirSync(
        candidateDirectory,
        {
          withFileTypes: true,
        },
      );

    const tracked =
      runGitReadOnly(
        [
          '-C',
          worktree,
          'ls-files',
          '--',
          relativeCandidateDirectory,
        ],
        { env },
      );

    const expectedTracked =
      relativeCandidateDirectory
        .replace(/\\/g, '/') +
      '/.gitkeep';

    placeholderOnly =
      entries.length === 1 &&
      entries[0].isFile() &&
      entries[0].name === '.gitkeep' &&
      tracked.ok &&
      tracked.stdout
        .replace(/\\/g, '/') ===
        expectedTracked;
  }
  catch {
    placeholderOnly = false;
  }

  return {
    clean:
      status.ok &&
      status.stdout.length === 0,

    placeholderOnly,
  };
}

export function probeCandidateFairness({
  repoRoot = process.cwd(),
  env = process.env,

  candidateABranch =
    'refs/heads/poc/electron-build-chain-vite',

  candidateBBranch =
    'refs/heads/poc/electron-build-chain-webpack',

  candidateADirectory =
    'poc/desktop-build-chain/candidate-a-vite',

  candidateBDirectory =
    'poc/desktop-build-chain/candidate-b-webpack',
} = {}) {
  const listed =
    runGitReadOnly(
      [
        '-C',
        repoRoot,
        'worktree',
        'list',
        '--porcelain',
      ],
      { env },
    );

  if (!listed.ok) {
    return {
      candidateAHead: null,
      candidateBHead: null,
      candidateAClean: false,
      candidateBClean: false,
      candidateAPlaceholderOnly: false,
      candidateBPlaceholderOnly: false,
      sameSharedLauncher: false,
    };
  }

  const worktrees =
    parseWorktreePorcelain(
      listed.stdout,
    );

  const candidateA =
    worktrees.find(
      (entry) =>
        entry.branch === candidateABranch,
    );

  const candidateB =
    worktrees.find(
      (entry) =>
        entry.branch === candidateBBranch,
    );

  const stateA =
    inspectCandidateWorktree({
      worktree:
        candidateA?.worktree ?? null,

      relativeCandidateDirectory:
        candidateADirectory,

      env,
    });

  const stateB =
    inspectCandidateWorktree({
      worktree:
        candidateB?.worktree ?? null,

      relativeCandidateDirectory:
        candidateBDirectory,

      env,
    });

  const sharedFiles = [
    'poc/desktop-build-chain/shared/preflight/windows-build-tools.launcher.mjs',
    'poc/desktop-build-chain/shared/preflight/windows-build-tools.mjs',
    'poc/desktop-build-chain/shared/preflight/windows-build-tools.contract.md',
    'poc/desktop-build-chain/shared/preflight/windows-build-tools.shared-versions.json',
  ];

  const sameSharedLauncher =
    Boolean(
      candidateA?.worktree &&
      candidateB?.worktree &&
      candidateA?.head &&
      candidateB?.head &&
      candidateA.head === candidateB.head,
    ) &&
    sharedFiles.every(
      (relativePath) =>
        filesEqual(
          path.join(
            candidateA.worktree,
            relativePath,
          ),
          path.join(
            candidateB.worktree,
            relativePath,
          ),
        ),
    );

  return {
    candidateAHead:
      candidateA?.head ?? null,

    candidateBHead:
      candidateB?.head ?? null,

    candidateAClean:
      stateA.clean,

    candidateBClean:
      stateB.clean,

    candidateAPlaceholderOnly:
      stateA.placeholderOnly,

    candidateBPlaceholderOnly:
      stateB.placeholderOnly,

    sameSharedLauncher,
  };
}

export function collectBuildToolsSnapshot({
  repoRoot = process.cwd(),
  env = process.env,
  includeEffectProbes = false,
  includeNetworkProbe = false,
  includeLauncherProbe = false,
  includeCandidateStoreProbe = false,
  includeCandidateFairnessProbe = false,
} = {}) {
  const corepack = runThroughCmd(
    'corepack --version',
    { env },
  );

  const pnpm = runThroughCmd(
    'pnpm --version',
    { env },
  );

  const pnpmStore = runThroughCmd(
    'corepack pnpm store path',
    { env },
  );

  const sharedVersions =
    readSharedQualificationVersions(
      repoRoot,
    );

  let launcherQualification = {
    tempShimWritable: false,
    pnpmChildProcessAvailable: false,
    pnpmVersion: null,
    bootstrapExceptionProcessScoped: false,
    parentExceptionUnchanged: false,
    tempShimCleanup: false,
  };

  let launcherPolicyQualification = {
    administratorRequired: null,
    executionPolicyMutated: null,
    freshShellSupported: null,
    priorDebugSessionRequired: null,
    temporaryLauncherStateCleaned: null,
  };

  if (includeLauncherProbe) {
    try {
      launcherPolicyQualification =
        rehearseLauncherPolicy({
          env,
          cwd: repoRoot,
        });

      launcherQualification =
        launcherPolicyQualification.launcher;
    } catch {
      // Opted-in qualification failure remains a failure.
    }
  }

  let candidateFairnessQualification = {
    candidateAHead: null,
    candidateBHead: null,
    candidateAClean: false,
    candidateBClean: false,
    candidateAPlaceholderOnly: false,
    candidateBPlaceholderOnly: false,
    sameSharedLauncher: false,
  };

  if (includeCandidateFairnessProbe) {
    try {
      candidateFairnessQualification =
        probeCandidateFairness({
          repoRoot,
          env,
        });
    } catch {
      // Opted-in candidate fairness remains unverified.
    }
  }

  let candidateStoreQualification = {
    isolatedCandidateStores: null,
    crossCandidateStoreReuse: null,
    probeCleaned: false,
  };

  if (includeCandidateStoreProbe) {
    try {
      candidateStoreQualification =
        rehearseCandidateStoreIsolation({
          env,
          cwd: repoRoot,
        });
    } catch {
      // Opted-in candidate store qualification remains unverified.
    }
  }

  let persistentState = {
    windowsLongPathsEnabled: null,
    userPathMutated: null,
    machinePathMutated: null,
  };

  try {
    persistentState = probeWindowsPersistentState({
      env,
    });
  } catch {
    // Unverified state remains null instead of being treated as a pass.
  }

  let persistentToolConfiguration = {
    globalGitLongPathsRequired: null,
    globalExoticSubdepsDisabled: null,
    persistentConfigProbeCleaned: false,
  };

  try {
    persistentToolConfiguration =
      probePersistentToolConfiguration({
        env,
      });
  } catch {
    // Unverified state remains null and cleanup is treated as failed.
  }

  let tempStorage = {
    verified: false,
    cleaned: false,
  };

  try {
    tempStorage = probeTemporaryStorage();
  } catch {
    // Snapshot records failure rather than throwing.
  }

  let nodeLongPath = {
    verified: false,
    cleaned: true,
  };

  let gitLongPath = {
    verified: false,
    cleaned: true,
  };

  if (includeEffectProbes) {
    try {
      nodeLongPath = probeNodeLongPath();
    } catch {
      nodeLongPath = {
        verified: false,
        cleaned: false,
      };
    }

    try {
      gitLongPath = probeGitLongPathEffect({
        env,
      });
    } catch {
      gitLongPath = {
        verified: false,
        cleaned: false,
      };
    }
  }

  let pinnedGit = {
    httpsAvailable: false,
    nonInteractive: false,
    commitVerified: false,
    cleaned: true,
  };

  if (includeNetworkProbe) {
    try {
      pinnedGit = probePinnedGitDependency({
        env,
      });
    } catch {
      pinnedGit = {
        httpsAvailable: false,
        nonInteractive: false,
        commitVerified: false,
        cleaned: false,
      };
    }
  }

  const publicDependencyPromptRequired =
    includeNetworkProbe
      ? (
          pinnedGit.httpsAvailable === true &&
          pinnedGit.nonInteractive === true &&
          pinnedGit.commitVerified === true
            ? false
            : null
        )
      : null;

  const freshShellRehearsalPassed =
    includeLauncherProbe &&
    includeNetworkProbe
      ? (
          launcherPolicyQualification.freshShellSupported === true &&
          launcherPolicyQualification.priorDebugSessionRequired === false &&
          publicDependencyPromptRequired === false &&
          launcherPolicyQualification.temporaryLauncherStateCleaned === true
        )
      : null;

  return {
    platform: process.platform,
    nodeVersion: process.version,
    packageManager: readPackageManager(repoRoot),

    sharedForgeVersion:
      sharedVersions.forge,

    sharedElectronVersion:
      sharedVersions.electron,

    corepackAvailable: corepack.ok,
    comSpecAvailable:
      typeof env.ComSpec === 'string' &&
      env.ComSpec.length > 0,

    pathExt: env.PATHEXT ?? '',

    windowsLongPathsEnabled:
      persistentState.windowsLongPathsEnabled,

    userPathMutated:
      persistentState.userPathMutated,

    machinePathMutated:
      persistentState.machinePathMutated,

    globalGitLongPathsRequired:
      persistentToolConfiguration.globalGitLongPathsRequired,

    globalExoticSubdepsDisabled:
      persistentToolConfiguration.globalExoticSubdepsDisabled,

    rawPnpmChildProcessAvailable: pnpm.ok,
    rawPnpmVersion:
      pnpm.ok
        ? pnpm.stdout.split(/\r?\n/)[0].trim()
        : null,

    pnpmChildProcessAvailable:
      includeLauncherProbe
        ? launcherQualification.pnpmChildProcessAvailable
        : pnpm.ok,

    pnpmVersion:
      includeLauncherProbe
        ? launcherQualification.pnpmVersion
        : pnpm.ok
          ? pnpm.stdout.split(/\r?\n/)[0].trim()
          : null,

    tempShimWritable:
      includeLauncherProbe
        ? launcherQualification.tempShimWritable
        : null,

    tempShimCleanup:
      includeLauncherProbe
        ? launcherQualification.tempShimCleanup
        : null,

    executionPolicyMutated:
      includeLauncherProbe
        ? launcherPolicyQualification.executionPolicyMutated
        : null,

    administratorRequired:
      includeLauncherProbe
        ? launcherPolicyQualification.administratorRequired
        : null,

    freshShellSupported:
      includeLauncherProbe
        ? launcherPolicyQualification.freshShellSupported
        : null,

    priorDebugSessionRequired:
      includeLauncherProbe
        ? launcherPolicyQualification.priorDebugSessionRequired
        : null,

    temporaryLauncherStateCleaned:
      includeLauncherProbe
        ? launcherPolicyQualification.temporaryLauncherStateCleaned
        : null,

    publicDependencyPromptRequired,

    freshShellRehearsalPassed,

    candidateAHead:
      includeCandidateFairnessProbe
        ? candidateFairnessQualification.candidateAHead
        : null,

    candidateBHead:
      includeCandidateFairnessProbe
        ? candidateFairnessQualification.candidateBHead
        : null,

    candidateAClean:
      includeCandidateFairnessProbe
        ? candidateFairnessQualification.candidateAClean
        : null,

    candidateBClean:
      includeCandidateFairnessProbe
        ? candidateFairnessQualification.candidateBClean
        : null,

    candidateAPlaceholderOnly:
      includeCandidateFairnessProbe
        ? candidateFairnessQualification.candidateAPlaceholderOnly
        : null,

    candidateBPlaceholderOnly:
      includeCandidateFairnessProbe
        ? candidateFairnessQualification.candidateBPlaceholderOnly
        : null,

    isolatedCandidateStores:
      includeCandidateStoreProbe
        ? candidateStoreQualification.isolatedCandidateStores
        : null,

    crossCandidateStoreReuse:
      includeCandidateStoreProbe
        ? candidateStoreQualification.crossCandidateStoreReuse
        : null,

    sameSharedLauncher:
      includeCandidateFairnessProbe
        ? candidateFairnessQualification.sameSharedLauncher
        : null,

    bootstrapExceptionProcessScoped:
      includeLauncherProbe
        ? launcherQualification.bootstrapExceptionProcessScoped
        : null,

    bootstrapExceptionLeftBehind:
      includeLauncherProbe
        ? !launcherQualification.parentExceptionUnchanged
        : null,

    tempWriteReadVerified:
      tempStorage.verified,

    nodeLongPathVerified:
      includeEffectProbes &&
      nodeLongPath.verified,

    gitLongPathEffectVerified:
      includeEffectProbes &&
      gitLongPath.verified,

    publicGitHttpsAvailable:
      includeNetworkProbe &&
      pinnedGit.httpsAvailable,

    publicGitNonInteractive:
      includeNetworkProbe &&
      pinnedGit.nonInteractive,

    pinnedCommitFetchVerified:
      includeNetworkProbe &&
      pinnedGit.commitVerified,

    privateSshRequiredForPublicDependencies:
      includeNetworkProbe
        ? !(
            pinnedGit.httpsAvailable &&
            pinnedGit.nonInteractive &&
            pinnedGit.commitVerified
          )
        : null,

    temporaryGitStateLeftBehind:
      includeNetworkProbe
        ? !pinnedGit.cleaned
        : null,

    disposableArtifactsCleaned:
      tempStorage.cleaned &&
      persistentToolConfiguration.persistentConfigProbeCleaned &&
      nodeLongPath.cleaned &&
      gitLongPath.cleaned &&
      pinnedGit.cleaned &&
      (
        !includeCandidateStoreProbe ||
        candidateStoreQualification.probeCleaned
      ),

    pnpmStoreResolved:
      pnpmStore.ok &&
      pnpmStore.stdout.length > 0,
  };
}

const FROZEN = Object.freeze({
  node: 'v24.14.0',
  pnpm: '11.4.0',
  forge: '7.11.2',
  electron: '43.2.0',
});

function selectsFrozenPnpm(packageManager) {
  if (typeof packageManager !== 'string') {
    return false;
  }

  return (
    packageManager === `pnpm@${FROZEN.pnpm}` ||
    packageManager.startsWith(`pnpm@${FROZEN.pnpm}+`)
  );
}

function hasCmdPathExtension(pathExt) {
  if (typeof pathExt !== 'string') {
    return false;
  }

  return pathExt
    .split(';')
    .map((item) => item.trim().toUpperCase())
    .includes('.CMD');
}

export function evaluateBuildToolsSnapshot(snapshot = {}) {
  const failures = new Set();

  const fail = (id, condition) => {
    if (condition) {
      failures.add(id);
    }
  };

  fail('BT-01', snapshot.platform !== 'win32');
  fail('BT-02', snapshot.nodeVersion !== FROZEN.node);
  fail('BT-03', !selectsFrozenPnpm(snapshot.packageManager));
  fail('BT-04', snapshot.corepackAvailable !== true);
  fail('BT-05', snapshot.comSpecAvailable !== true);
  fail('BT-06', !hasCmdPathExtension(snapshot.pathExt));
  fail('BT-07', snapshot.pnpmChildProcessAvailable !== true);
  fail('BT-08', snapshot.pnpmVersion !== FROZEN.pnpm);

  fail('BT-44',
    snapshot.sharedForgeVersion !== FROZEN.forge,
  );

  fail('BT-45',
    snapshot.sharedElectronVersion !== FROZEN.electron,
  );

  fail('BT-09', snapshot.tempShimWritable !== true);

  fail('BT-10',
    snapshot.userPathMutated !== false ||
    snapshot.machinePathMutated !== false,
  );

  fail('BT-11', snapshot.executionPolicyMutated !== false);
  fail('BT-12', snapshot.administratorRequired !== false);
  fail('BT-13', snapshot.tempShimCleanup !== true);

  fail('BT-14', snapshot.bootstrapExceptionProcessScoped !== true);
  fail('BT-15', snapshot.globalExoticSubdepsDisabled !== false);
  fail('BT-16', snapshot.bootstrapExceptionLeftBehind !== false);

  fail('BT-17', snapshot.publicGitHttpsAvailable !== true);
  fail('BT-18', snapshot.publicGitNonInteractive !== true);
  fail('BT-19', snapshot.pinnedCommitFetchVerified !== true);
  fail(
    'BT-20',
    snapshot.privateSshRequiredForPublicDependencies !== false,
  );
  fail('BT-21', snapshot.temporaryGitStateLeftBehind !== false);

  fail('BT-22', snapshot.windowsLongPathsEnabled !== true);
  fail('BT-23', snapshot.nodeLongPathVerified !== true);
  fail('BT-24', snapshot.gitLongPathEffectVerified !== true);
  fail('BT-25', snapshot.globalGitLongPathsRequired !== false);

  fail('BT-27', snapshot.tempWriteReadVerified !== true);
  fail('BT-28', snapshot.pnpmStoreResolved !== true);
  fail('BT-29', snapshot.disposableArtifactsCleaned !== true);

  fail('BT-30', snapshot.npmRegistryReachable !== true);
  fail('BT-31', snapshot.githubHttpsReachable !== true);
  fail('BT-32', snapshot.electronReleaseAssetReachable !== true);

  fail(
    'BT-33',
    typeof snapshot.candidateAHead !== 'string' ||
    typeof snapshot.candidateBHead !== 'string' ||
    snapshot.candidateAHead !== snapshot.candidateBHead,
  );

  fail(
    'BT-34',
    snapshot.candidateAClean !== true ||
    snapshot.candidateBClean !== true,
  );

  fail(
    'BT-35',
    snapshot.candidateAPlaceholderOnly !== true ||
    snapshot.candidateBPlaceholderOnly !== true,
  );

  fail('BT-36', snapshot.isolatedCandidateStores !== true);
  fail('BT-37', snapshot.crossCandidateStoreReuse !== false);
  fail('BT-38', snapshot.sameSharedLauncher !== true);

  fail('BT-39', snapshot.freshShellSupported !== true);
  fail('BT-40', snapshot.priorDebugSessionRequired !== false);
  fail('BT-41', snapshot.publicDependencyPromptRequired !== false);
  fail('BT-42', snapshot.temporaryLauncherStateCleaned !== true);
  fail('BT-43', snapshot.freshShellRehearsalPassed !== true);

  const failureList = [...failures];

  return {
    ok: failureList.length === 0,
    failures: failureList,
  };
}

export { FROZEN };
