# Windows Shared Build Tools Preflight 2.0 Evidence

> Status: Pre-merge technical verification
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

The automated network-effects check therefore requires a later successful network window before the final shared qualification result is declared.

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

## Current result

```text
Shared deterministic preflight: PASS
Deterministic regression: 61/61 PASS
Pinned HTTPS dependency fetch: VERIFIED
Automated network-effects check: PENDING STABLE NETWORK WINDOW
Candidate fairness BT-33 through BT-37: PASS
Candidate fairness BT-38: PASS
Final shared qualification: NOT YET DECLARED
```

Post-merge synchronization and BT-38 verification are complete. The remaining technical gate is a successful automated network-effects verification during a stable external network window.
