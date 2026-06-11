---
id: web-pages-user-profile-routes-transfers
title: User profile — wallet and transfers
description: "Wallet tabs and transfer history under `/@:name/transfers/...`. Wallet primary nav uses `?type=` (e.g. WAIV)."
type: spec
status: active
scope: web
tags: [web, page, user-profile, wallet]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/pages/user-profile/profile-shell.md
---

# User profile — wallet and transfers

**Back:** [profile shell](../profile-shell.md)

## Purpose

Wallet tabs and transfer history under `/@:name/transfers/...`. Wallet primary nav uses `?type=` (e.g. WAIV).

## Routes

| Public URL | App Router file | Layout |
|------------|-----------------|--------|
| `/@:name/transfers` | `(main)/transfers/page.tsx` | main three-column |
| `/@:name/transfers/table` | `(main)/transfers/table/page.tsx` | main |
| `/@:name/transfers/waiv-table` | `(profile)/transfers/waiv-table/page.tsx` | single column |
| `/@:name/transfers/details` | `(main)/transfers/details/page.tsx` | main |
| `/@:name/transfers/details/:reportId` | `(main)/transfers/details/[reportId]/page.tsx` | main |

## Query params

| Param | Values | Effect |
|-------|--------|--------|
| `type` | `WAIV` (default), `HIVE`, `ENGINE`, `rebalancing` | Wallet tab active state in [user-menu.md](../components/user-menu.md) secondary row |
| `tab` | (waiv-table page only) | In-page tabs on `/@:name/transfers/waiv-table` — not header submenu |

## Current implementation

> **TODO: spec-code divergence** — landing `/transfers` uses `ProfileRouteStub`. Sub-routes may be stub or partial.

Shell hides left/right rails on `waiv-table` layout — see [profile-shell.md](../profile-shell.md).

## Verification

Manual: `/@:name/transfers?type=WAIV` from user menu.
