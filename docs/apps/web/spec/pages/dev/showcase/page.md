---
id: web-pages-dev-showcase-page
title: Dev layout showcase
description: Internal-only demo of layout primitives, shell modes, theme/locale switchers, and content arrangements. Not linked from production nav.
type: spec
status: draft
scope: web
tags: [web, page, dev, layout]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/layout-system.md
  - docs/apps/web/spec/shell-mode.md
  - docs/apps/web/spec/theme.md
  - docs/apps/web/spec/pages/index.md
---

# Dev layout showcase (`/dev/showcase`)

**Back:** [pages index](../index.md) · **Related:** [layout-system.md](../../layout-system.md), [shell-mode.md](../../shell-mode.md)

## Purpose

Internal-only demo of layout primitives, shell modes, theme/locale switchers, and content arrangements. Not linked from production nav.

## Routes

| Public URL | App Router file |
|------------|-----------------|
| `/dev/showcase` | `(app)/dev/showcase/page.tsx` |

## Content

Renders `AppShell`, `PublicShell`, `ImmersiveShell`, grids, sticky regions, and `ContentArrangementSwitcher` for local visual QA.

## Verification

Manual: `pnpm nx dev web` → open `/dev/showcase`.
