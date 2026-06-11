---
id: web-pages-user-profile-routes-about
title: User profile — about
description: "Extended profile information at `/@:name/about`. Uses about-specific layout (main + right rail, no left rail)."
type: spec
status: active
scope: web
tags: [web, page, user-profile, about]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/pages/user-profile/profile-shell.md
  - docs/apps/web/spec/pages/index.md
---

# User profile — about

**Back:** [profile shell](../profile-shell.md) · [web overview](../../../overview.md)

## Purpose

Extended profile information at `/@:name/about`. Uses about-specific layout (main + right rail, no left rail).

## Routes

| Public URL | App Router file |
|------------|-----------------|
| `/@:name/about` | `(profile)/about/page.tsx` |

Layout: [`about/layout.tsx`](../../../../../apps/web/src/app/(app)/user-profile/[name]/(profile)/about/layout.tsx).

## Current implementation

> **TODO: spec-code divergence** — page renders `ProfileRouteStub` until about content is wired.

## Verification

Manual: `/@:name/about` — single column + right sidebar per shell layout.
