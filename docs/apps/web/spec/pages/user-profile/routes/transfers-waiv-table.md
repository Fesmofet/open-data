---
id: web-transfers-waiv-table
title: WAIV transfers table (advanced reports)
description: "WAIV advanced report table at /@:name/transfers/waiv-table with exemption toggles and CSV export."
type: spec
status: active
scope: web
tags: [web, user-profile, wallet, waiv, advanced-report]
updated_at: 2026-07-01
parent: web-user-profile-transfers
see_also:
  - docs/apps/web/spec/pages/user-profile/routes/transfers-table.md
  - docs/apps/query-api/spec/user-waiv-advanced-report-endpoint.md
---

# WAIV transfers table (advanced reports)

Route: `/@:name/transfers/waiv-table` — single-column shell (rails hidden).

## Tabs

| Query `tab` | Behavior |
|-------------|----------|
| `standard` (default) | Live WAIV advanced report |
| `generate` | Generated reports list + async jobs; detail via `reportId` query param |

## Standard tab

Mirrors [Hive advanced report](transfers-table.md) browse/submit flow with WAIV-specific data and filters.

### Extra filter

- **Exclude swaps and trades records** — checkbox, **default ON** (`includeSwapsAndTrades: false` in API).

### Columns

X, Date, WAIV, WP, WAIV/{currency}, ±, Account, Description, Memo.

### Auth

Session required; BFF `POST /api/wallet/waiv/advanced-report` forwards Bearer JWT.

### Exemptions

- Checkbox column (X): any **logged-in viewer** can toggle (`Boolean(viewerUsername)`), not only the profile owner.
- Toggles post to `POST /api/wallet/hive/exemptions` (shared with Hive table).
- WAIV row key is `operationIndex` (FNV hash of `source + account + timestamp + tieId`) — see [query-api WAIV spec](../../../../query-api/spec/user-waiv-advanced-report-endpoint.md#waiv-operationindex-contract).

**After deploy:** exemptions saved on the WAIV table before the stable `tieId` release do not restore automatically. Users must re-check rows they want excluded.

### Manual QA (exemptions)

1. Logged-in → Submit report → toggle a row → reload page → row still checked
2. Toggle off → reload → unchecked; deposits/withdrawals totals update
3. Logged-out → checkbox column hidden/disabled

## Generated tab

Route: `?tab=generate` — list + generate form (requires login).

Detail: `?tab=generate&reportId={uuid}` — stored report table only (no list below). Back link returns to list.

List shows **all reports for the logged-in owner** (`owner === session`), regardless of profile URL in the route.

List table columns: from, till, **accounts**, status, deposits, withdrawals, rows, actions (Details, Export to CSV, Delete with confirm modal).

BFF routes under `apps/web/src/app/api/wallet/waiv/generated-reports/` require session via `requireGeneratedReportSession()` (401 when logged out).

Filters match Standard tab plus **Merge author and curation rewards** (`mergeRewards`, default ON) — legacy 30-day consecutive-reward fold.

BFF: `apps/web/src/app/api/wallet/waiv/generated-reports/`

See [query-api WAIV generated spec](../../../../query-api/spec/user-waiv-generated-report-endpoint.md).

## Code map

| Piece | Path |
|-------|------|
| Page | `apps/web/src/app/(app)/user-profile/[name]/(profile)/transfers/waiv-table/page.tsx` |
| Table | `apps/web/src/modules/user-wallet/presentation/components/waiv/advanced-report/` |
| BFF | `apps/web/src/app/api/wallet/waiv/advanced-report/route.ts` |
| Entry link | `transfers-waiv-wallet-view.tsx` → `table_view` |

## Verification

```bash
pnpm nx run web:typecheck
pnpm nx test web --testPathPatterns=waiv-advanced-report
pnpm nx test web --testPathPatterns=load-waiv-generated-report-rows
pnpm nx test query-api --testPathPatterns=waiv-generated-report
```
