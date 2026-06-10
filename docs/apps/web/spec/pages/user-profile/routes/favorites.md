---
id: web-pages-user-profile-routes-favorites
title: User profile — favorites
type: spec
status: active
scope: web
tags: [web, page, user-profile, favorites]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/pages/user-profile/profile-shell.md
---

# User profile — favorites

**Back:** [profile shell](../profile-shell.md)

## Purpose

Favorite objects for a user at `/@:name/favorites` with optional type filter segment.

## Routes

| Public URL | App Router file |
|------------|-----------------|
| `/@:name/favorites` | `(main)/favorites/page.tsx` |
| `/@:name/favorites/:objectType` | `(main)/favorites/[objectType]/page.tsx` |

## Current implementation

> **TODO: spec-code divergence** — `ProfileRouteStub` on landing route until favorites API is wired.

## Verification

Manual: nav from [user-menu.md](../components/user-menu.md).
