# Windows Environment Baseline

> Status: Recorded / Preflight only  
> Captured: 2026-08-02 23:07:00 UTC+08:00  
> Repository baseline: `1a97d3aa0aac389abb2dba538ff40bd42c001020`

## Purpose

Record the Windows development environment before any desktop build-chain candidate is installed or executed.

This document does not prove that Electron packaging, native modules, CI, installation, uninstall, security boundaries, or reproducibility have passed.

## Confirmed

### Operating system

```text
Edition: Microsoft Windows 11 Pro
Version: 10.0.26200
Build: 26200
OS architecture: 64-bit
Processor architecture signal: AMD64 / x64
System time zone: China Standard Time / UTC+08:00
```

### Hardware

```text
CPU: AMD Ryzen 7 5800H with Radeon Graphics
Physical cores: 8
Logical processors: 16
Physical memory: 15.86 GiB
Development volume free space at capture: 226.27 GiB
```

### Toolchain discovery

```text
Node.js: v24.14.0
Corepack: 0.34.6
pnpm command: Unavailable / Not activated
Git: 2.53.0.windows.2
Python: 3.14.3
Visual Studio Installer vswhere: Not found at the standard path
Visual Studio / Build Tools registry instances: Not detected
```

No tool was installed, enabled, upgraded, downgraded, or removed while collecting this baseline.

### Repository state

```text
Branch at capture: main
HEAD: 1a97d3aa0aac389abb2dba538ff40bd42c001020
origin/main: 1a97d3aa0aac389abb2dba538ff40bd42c001020
Origin transport: SSH
Working tree: Clean
```

## Confirmed isolation boundary

The following variable-based roots are reserved for later qualification work:

```text
POC data: %LOCALAPPDATA%\YrenPersonalOS-POC
Independent test data: %LOCALAPPDATA%\YrenPersonalOS-Test
Temporary build and test files: %TEMP%\YrenPersonalOS-POC
Future production data: %LOCALAPPDATA%\YrenPersonalOS
```

At capture time, all four paths were absent.

Rules:

- POC and test work must not read or write the future production-data root.
- Real provider secrets are prohibited from POC and test execution.
- Only fictional test values may be used where a credential-shaped value is required.
- User files, personal records, private configuration, backups, and production databases are out of scope.
- Public evidence must use variable-based paths and must not include local usernames or absolute personal paths.

## Accepted execution limits

```text
Remaining Preflight preparation: 2 effective hours
Candidate A: 6 effective hours
Candidate B: 6 effective hours
Independent review: 4 effective hours
```

The timeboxes have not started.

## Assumption

- The current machine can support both candidates after the required package manager and any proven build prerequisites are deliberately established.
- Missing pnpm activation and missing Visual Studio Build Tools do not yet prove candidate failure.

## Proposal

- Use Corepack to establish the project-selected pnpm version only after the version is frozen through the candidate checklist.
- Install Visual Studio Build Tools only when a candidate or native dependency demonstrates that the component is required.
- Keep candidate implementation, independent review, POC data, test data, and future production data physically separated.

## Open

- Project pnpm version and activation method.
- Electron, Forge, Vite, and Webpack candidate versions.
- Whether Visual Studio Build Tools are required by the selected dependency graph.
- Implementation and independent-review Worktree paths.
- Exact startup guards for POC, test, and production data roots.
- CI runner versions and reproducibility evidence.

## Superseded

- Treating an unavailable `pnpm` command as proof that the machine cannot run the qualification.
- Installing tools during evidence collection before versions and candidate requirements are frozen.
- Publishing local usernames, private key paths, secrets, or absolute personal paths as technical evidence.

## Current result

```text
Environment capture: PASS WITH CONDITIONS
Repository baseline: PASS
Isolation roots approved: PASS
Dependency installation: Not Started
Candidate A: Not Started
Candidate B: Not Started
Independent review: Not Started
Technology selection: Open
```
