---
id: web-pages-user-profile-routes-expertise
title: User profile — expertise
type: spec
status: active
scope: web
tags: [web, page, user-profile, expertise]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/pages/user-profile/profile-shell.md
---

# User profile — expertise

**Back:** [profile shell](../profile-shell.md)

## Purpose

Expertise hashtags and objects under `/@:name/expertise-*`.

## Routes

| Public URL | App Router file |
|------------|-----------------|
| `/@:name/expertise-hashtags` | `(main)/expertise-hashtags/page.tsx` |
| `/@:name/expertise-objects` | `(main)/expertise-objects/page.tsx` |

Subnav: [user-menu.md](../components/user-menu.md) / `user-profile-subnav.ts`.

## Current implementation

> **TODO: spec-code divergence** — both routes use `ProfileRouteStub`.

## Verification

Manual: secondary subnav under Expertise primary tab.
