---
id: web-pages-user-profile-routes-map
title: User profile — map
description: "Map view for a user profile at `/@:name/map`. Full-width center column (no sidebars)."
type: spec
status: active
scope: web
tags: [web, page, user-profile, maps]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/pages/user-profile/profile-shell.md
  - docs/apps/web/spec/maps.md
---

# User profile — map

**Back:** [profile shell](../profile-shell.md) · **Related:** [maps.md](../../../maps.md)

## Purpose

Map view for a user profile at `/@:name/map`. Full-width center column (no sidebars).

## Routes

| Public URL | App Router file |
|------------|-----------------|
| `/@:name/map` | `(profile)/map/page.tsx` |

Layout: [`map/layout.tsx`](../../../../../apps/web/src/app/(app)/user-profile/[name]/(profile)/map/layout.tsx).

## Current implementation

> **TODO: spec-code divergence** — `ProfileRouteStub` placeholder; future: `AppMap` from `@/modules/map`.

## Verification

Manual: sidebars hidden; map layout single column.
