# Composable Desktop Workspace

Status: implementation architecture note

This document defines the renderer-side workspace composition model for future
Personal OS features. It is not a replacement for the macOS 26 Tahoe / Liquid
Glass UI/UX specification. Visual tokens, material values, accessibility
semantics, and optical behavior remain governed by that specification and the
existing Foundation runtime.

## Canonical terminology

The recommended product term is **Composable Desktop Workspace**:

- **Content Workspace** — the stable central work area where the current page
  and business content remain visible.
- **Navigation Rail** — the left navigation surface that changes the active
  product space without owning page content.
- **Command Layer** — the floating command surface for Search, Notifications,
  Proposals, Quick Create, and Main AI entry points.
- **Contextual Focus Panel** — a right-side, above-content panel that preserves
  the current workspace context. Main AI is the first example.
- **Workspace Panel** — a formal outer surface that may be resized or included
  in a named workspace preset.
- **Workspace Preset** — a saved arrangement of panel geometry and appearance
  preferences. It does not save business data or feature state.

“Dockable workspace” is appropriate for the future extension that adds explicit
docking targets, splitters, and drag-to-dock zones. The current foundation is a
resizable and preset-aware workspace; it is not yet a full docking engine.

## Layer model

```text
Window Environment
├── Navigation Rail
├── Content Workspace
├── Command Layer
└── Contextual Focus Layer
    └── Main AI / Inspector / future contextual tools
```

The layers are presentation containers. They must not become new sources of
truth for routes, projects, tasks, proposals, AI state, or persistence.

## Function and presentation separation

Every feature owns its function independently from its presentation location.
Moving, resizing, opening, or closing a panel must not change:

- route or navigation state;
- business data or read models;
- proposal/approval semantics;
- AI backend or runtime state;
- DB, IPC, preload, or DSH contracts.

The renderer may bind a formal outer surface to a stable `layoutId`. That ID is
only a geometry key. It is not a business identifier and must not be used as a
second feature state machine.

## Resizing contract

Only formal outer Workspace Panels are resizable. Internal rows, buttons,
inputs, chips, list items, and decorative wrappers are not resize targets.

The current contract is:

1. Normal panels resize from the right and/or bottom edge.
2. Right-anchored contextual panels, such as Main AI, resize from the left
   edge so their right boundary remains stable.
3. A panel cannot cross its parent workspace boundary.
4. A panel cannot reduce below its default/content-safe minimum.
5. Adjacent panels retain the Foundation gap.
6. Grid parents reallocate tracks so neighboring panels move with the resized
   panel instead of being overlapped.
7. A content-driven parent may grow until the enclosing workspace boundary;
   a bounded parent remains the authority for the maximum size.
8. Resetting a layout removes custom geometry and returns to responsive
   Foundation defaults.

## Preset contract

Workspace presets may contain:

- panel geometry keyed by `layoutId`;
- UI scale profile;
- Liquid Glass appearance preference;
- a user-defined preset name.

Workspace presets must not contain:

- project/task/proposal records;
- current route as business state;
- fake AI results;
- database records;
- runtime credentials or DSH configuration.

Default and custom appearance modes must preserve the last saved custom layout.
Switching to Default must not overwrite the custom preset; switching back to
Custom restores it.

## Future Bookshelf / Materials extension

When Bookshelf and Materials become real workspaces, extend this contract with:

- a panel registry describing allowed panel roles;
- splitters with keyboard-accessible resize commands;
- explicit drop zones for docking and undocking;
- collision-aware min/max constraints per panel role;
- responsive compact/normal/wide policies;
- named workspace presets with schema versioning and migration;
- an “insertion” or “focus” mode for temporary reading, annotation, and AI
  assistance surfaces.

The first implementation should keep the document/canvas content stable while
allowing Reading, Annotation, References, Outline, and Main AI panels to be
rearranged around it. The content model remains independent from the panel
arrangement.

## Current implementation mapping

- `CanonicalGlassSurface` is the shared outer material and layout surface.
- `LayoutResizeProvider` owns transient drag state and boundary calculation.
- `uiContainerSizes` stores persisted panel geometry.
- `uiLayoutPresets` stores named workspace arrangements.
- `appearance-service.mjs` normalizes and persists the appearance/layout
  contract.
- Foundation Glass tokens remain the sole material source.

This note documents implementation direction only. Future visual decisions must
continue to be reviewed against the authoritative macOS 26 Tahoe / Liquid Glass
design specification.
