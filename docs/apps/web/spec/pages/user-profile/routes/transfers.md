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
| `type` | `WAIV` (default), `HIVE`, `ENGINE` | Wallet tab active state in [user-menu.md](../components/user-menu.md) secondary row |
| `tab` | (waiv-table page only) | In-page tabs on `/@:name/transfers/waiv-table` — not header submenu |

## Current implementation

WAIV tab (`?type=WAIV`): summary card with balances, est. account value, and Engine token operations (power up/down, transfer, delegate, manage delegations) for the profile owner. Data from `GET /query/v1/users/{name}/wallet/waiv`.

**Layout:** each balance row shows the amount top-right with the action button **below** the amount (legacy parity). Subtitle stays left under the row title.

**Unavailable state:** when query-api returns `503`, network fails, or the response fails Zod validation, the tab shows `t('unavailable')` — never a summary card with fake zero balances.

**Broadcast:** Keychain signs inline; Hive Engine ops use the **active** key. HiveSigner redirects to hivesigner.com for active-key `custom_json` (no error flash before redirect). After broadcast: trx confirmation → `revalidateUserWaivWalletAfterBroadcast` → `router.refresh()`.

**Manage delegations:** client fetch to `GET /api/users/{name}/wallet/engine/{symbol}/delegations` (BFF → query-api). Delegation lists use cache tags invalidated on wallet broadcast.

**Owner-only:** wallet action buttons and modals render only when `viewerUsername` matches profile `name` (case-insensitive).

Other wallet tabs remain stubbed.

Shell hides left/right rails on `waiv-table` layout — see [profile-shell.md](../profile-shell.md).

## Verification

Manual: `/@:name/transfers?type=WAIV` from user menu.
