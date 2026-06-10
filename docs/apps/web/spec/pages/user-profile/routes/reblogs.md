---
id: web-pages-user-profile-routes-reblogs
title: User profile — reblogs
type: spec
status: active
scope: web
tags: [web, page, user-profile, feed]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/pages/user-profile/routes/feed.md
---

# User profile — reblogs

**Back:** [profile shell](../profile-shell.md) · **Related:** [feed.md](feed.md)

## Purpose

Reblog list at `/@:name/reblogs`.

## Routes

| Public URL | App Router file |
|------------|-----------------|
| `/@:name/reblogs` | `(main)/reblogs/page.tsx` |

## Current implementation

> **TODO: spec-code divergence** — `ProfileRouteStub` until reblog feed is wired.

## Verification

Manual: primary nav link from user menu.
