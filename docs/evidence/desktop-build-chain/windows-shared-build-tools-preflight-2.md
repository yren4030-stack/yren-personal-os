# Windows Shared Build Tools Preflight 2.0 Evidence

> Status: Final technical verification
> Captured: 2026-08-09T23:45:17+08:00
> Scope: Shared Windows desktop build-chain qualification only

## Purpose

Record the technical verification state of the shared Windows build-tool preflight before candidate-specific desktop build-chain implementation begins.

This evidence does not declare either candidate qualified. Candidate-specific development, packaging results, production signing, native-module compilation, and final post-merge candidate synchronization remain outside this pre-merge result.

## Frozen shared versions

The shared qualification inputs are:

```text
Node.js: 24.14.0
pnpm: 11.4.0
Electron Forge: 7.11.2
Electron: 43.2.0
```

The Forge and Electron qualification inputs are stored independently in:

```text
poc/desktop-build-chain/shared/preflight/windows-build-tools.shared-versions.json
```

## Confirmed launcher behavior

The shared launcher verification confirms:

- Corepack-managed pnpm can be exposed to Windows child processes through a writable disposable shim directory.
- The temporary shim is process-scoped.
- PowerShell ExecutionPolicy is not modified.
- Administrator elevation is not required.
- The Forge bootstrap exception for exotic subdependencies is process-scoped.
- Parent-shell pnpm configuration is preserved.
- Temporary launcher artifacts are removed after execution.
- Fresh-shell qualification does not require prior debug-session state.

## Confirmed persistent-state behavior

Verification confirms:

- Windows long-path support is enabled.
- Node.js long-path behavior is verified by effect.
- Git long-path behavior is verified using command-scoped `core.longpaths=true`.
- Global Git long-path configuration is not required.
- Persistent User or Machine PATH mutation is not required.
- Persistent pnpm exotic-subdependency configuration is not required.
- Temporary qualification artifacts are cleaned.

## Public Git dependency verification

The pinned public Git dependency used by the Electron rebuild chain is:

```text
Repository:
https://github.com/electron/node-gyp.git

Commit:
06b29aafb7708acef8b3669835c8a7857ebc92d2
```

Direct non-interactive HTTPS fetch verification succeeded and the fetched commit matched the required commit exactly.

Intermittent external network failures were observed during the automated network-effects probe. Because the same pinned HTTPS fetch succeeded in direct diagnostic runs, no build-tool configuration or acceptance criterion was changed solely to mask external network instability.

A subsequent automated network-effects run completed successfully during a stable external network window. The remaining network gate therefore passed.

## Candidate fairness verification

Before candidate implementation begins, automated and direct verification confirmed:

- BT-33: Candidate A and Candidate B begin from the same Git commit.
- BT-34: Both candidate worktrees are clean.
- BT-35: Both candidate implementation directories remain in the approved placeholder-only state.
- BT-36: Candidate A and Candidate B use separate cold pnpm qualification stores.
- BT-37: Neither candidate consumes the other candidate's qualification store.

BT-38 was intentionally not declared passed in the original pre-merge state. Post-merge verification has now confirmed BT-38.

After the shared remediation was merged, both candidate worktrees were synchronized to canonical main commit `80ccd62d6e79de407387b365c1ae84ca3724c3c4`. The automated fairness probe then confirmed matching candidate HEADs, clean worktrees, placeholder-only candidate directories, and the same shared launcher and preflight implementation. BT-38 therefore passed.

## Regression verification

The final deterministic pre-merge regression, excluding the externally network-dependent effects test, completed successfully:

```text
Tests: 61
Passed: 61
Failed: 0
```

A previous full regression also completed successfully before the final text normalization pass:

```text
Tests: 62
Passed: 62
Failed: 0
```

After normalization to UTF-8 without BOM, LF line endings, and a single final newline, all 61 deterministic tests continued to pass.

## Repository hygiene

The staged shared-preflight change set was verified for:

- approved path scope only;
- no candidate implementation changes;
- no private absolute machine paths;
- no credential or secret values;
- no private-key material;
- no internal execution-time governance content;
- no TODO, FIXME, HACK, XXX, or debugger residue;
- UTF-8 without BOM;
- LF line endings;
- no trailing whitespace;
- no extra blank line at end of file;
- clean `git diff --cached --check`.

## Original pre-start result

```text
Shared deterministic preflight: PASS
Deterministic regression: 61/61 PASS
Pinned HTTPS dependency fetch: VERIFIED
Automated network-effects check: PASS
Candidate fairness BT-33 through BT-37: PASS
Candidate fairness BT-38: PASS
Final shared technical qualification: PASS
```

Post-merge BT-38 verification and automated network-effects verification are complete. All shared technical qualification gates have passed. Repository closure still requires this evidence update to be merged and both candidate worktrees to be resynchronized to the resulting canonical main commit.
## Post-start shared remediation

After Candidate A began qualification, the real Forge/pnpm bootstrap exposed a Shared transport coverage gap that the original direct HTTPS probe had not exercised.

The public `electron/node-gyp` dependency was declared from GitHub but pnpm's hosted-Git resolution produced the escaped form:

```text
git+ssh://git@github.com/electron/node-gyp.git
```

Effective local SSH host resolution then attempted `ssh.github.com:443`, which could require a private SSH identity. This contradicted BT-17 through BT-20 for the real bootstrap path. The Shared contract itself remained valid; the launcher implementation and test coverage were remediated.

The remediation adds:

- a process-scoped public Git HTTPS policy with `GIT_TERMINAL_PROMPT=0`;
- appended `GIT_CONFIG_*` `url.https://github.com/.insteadOf` rules while preserving inherited process-scoped Git configuration;
- a real `runPnpmThroughSharedLauncher()` path so Candidate pnpm/Forge commands use the same disposable Corepack shim, isolated store, bootstrap exception, Git transport policy, and cleanup behavior;
- a transport regression covering the escaped GitHub SSH form;
- a command-runner integration regression proving the real pnpm child receives the Shared environment;
- a network-effects probe that starts from the escaped `git+ssh://git@github.com/electron/node-gyp.git` form and verifies the pinned commit by resulting `FETCH_HEAD`.

Post-remediation verification completed successfully:

```text
Git transport integration: 1/1 PASS
Shared command-runner integration: 1/1 PASS
Targeted automated network-effects: 1/1 PASS
Phase-applicable deterministic regression: 62/62 PASS
git diff --check: PASS
Temporary diagnostic store cleanup: PASS
```

The pre-start `snapshot-fairness` test is intentionally not counted in the post-start deterministic regression because Candidate A has legitimate qualification changes after its first 20 effective engineering minutes. That test remains a pre-start snapshot check rather than a requirement that a running candidate remain clean.

## Current result

```text
Shared remediation implementation: PASS
BT-17 through BT-20 real-bootstrap transport remediation: PASS
Real Shared pnpm command path: PASS
Targeted escaped-URL network-effects verification: PASS
Phase-applicable deterministic regression: 62/62 PASS
Repository hygiene checks: PASS
Shared remediation repository closure: PENDING MERGE / CANDIDATE RESYNC
Candidate A resume gate: PENDING
```

The Shared blocker is technically remediated on the remediation branch. Repository closure still requires this change set to be committed and merged to canonical `main`, followed by resynchronization of both candidate worktrees to the resulting Shared baseline and a resume-specific fairness verification before Candidate A qualification resumes.
