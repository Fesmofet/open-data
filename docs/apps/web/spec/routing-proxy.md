---
id: web-routing-proxy
title: Routing and proxy
description: Document request-time rewrites and session refresh in `apps/web/src/proxy.ts` (Next.js 16 proxy convention). Static config rewrites in `next.config.js` are minimal; **`/@account` and object tab URLs depend on this proxy**.
type: spec
status: active
scope: web
tags: [web, routing, cross-cutting]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/overview.md
  - docs/apps/web/spec/layout-system.md
  - docs/apps/web/spec/pages/user-profile/profile-shell.md
  - docs/apps/web/spec/pages/object/navigation.md
---

# Routing and proxy

**Back:** [web overview](overview.md) · **Related:** [layout-system](layout-system.md), [profile shell](pages/user-profile/profile-shell.md)

## Purpose

Document request-time rewrites and session refresh in `apps/web/src/proxy.ts` (Next.js 16 proxy convention). Static config rewrites in `next.config.js` are minimal; **`/@account` and object tab URLs depend on this proxy**.

## Matcher

Runs on all paths except `_next/static`, `_next/image`, `favicon.ico`. Account names may contain dots (e.g. `@coffee.time`).

## Session refresh

Before route handling, `refreshSessionCookiesIfNeeded`:

- If `odl_access` missing/expired but `odl_refresh` valid → `POST` auth-api refresh, set new httpOnly cookies.
- Skips `/api/auth/*` to avoid refresh loops.
- `env.requireAuth`: unauthenticated requests redirect to `/sign-in` except excluded prefixes (`/sign-in`, `/has`, `/api/auth/`, `/images/`).

## Object page rewrites

| Incoming pathname | Rewrite |
|-------------------|---------|
| `/object/:id/gallery/album/:name` | `/object/:id?tab=gallery&gallery_album=:name` |
| `/object/:id/category/:name` | `/object/:id?tab=category&category_name=:name` |
| `/object/:id/updates/:updateId` | `/object/:id?tab=updates&object_update_id=:updateId` |
| `/object/:id/:tab` for each tab segment | `/object/:id?tab=:tab` |

Address bar keeps the clean path; single `object/[object-id]/page.tsx` handles all variants. See [object navigation](pages/object/navigation.md).

## Profile rewrites (`/@…`)

| Incoming | Rewrite |
|----------|---------|
| `/@account` only | `/user-profile/account` |
| `/@account/:head/...` when `head` is reserved profile segment | `/user-profile/account/head/...` |
| `/@account/:tail/...` otherwise | `/user-profile/account/post/tail/...` (permalink — avoids modal intercept eating tab names) |

Reserved segments: `isUserProfileReservedFirstSegment` in `profile-path.ts`.

## Route groups (URL-invisible)

| Group | Shell |
|-------|-------|
| `(app)` | `AppShell` + header — [layout-system.md](layout-system.md) |
| `(public)` | `PublicShell` — sign-in |
| `(immersive)` | `ImmersiveShell` |

## Verification

| Check | How |
|-------|-----|
| Profile URL | Navigate to `/@name/followers` — bar shows `/@…`, content from `/user-profile/…` |
| Object tab | `/object/:id/updates` — tab query injected, page renders updates feed |
| Auth gate | `REQUIRE_AUTH=true` — anonymous GET `/discover` redirects to sign-in; anonymous GET `/has` allowed (HAS Keychain redirect) |

## Related code paths

| Path | Role |
|------|------|
| `apps/web/src/proxy.ts` | Main proxy export |
| `apps/web/src/shared/infrastructure/auth/refresh-session.ts` | Cookie refresh |
| `apps/web/next.config.js` | Notes proxy ownership of `/@` rewrites |
