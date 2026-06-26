---
id: web-transfers-waiv-table
title: WAIV transfers table (advanced reports)
parent: web-user-profile-transfers
tags: [web, user-profile, wallet, waiv, advanced-report]
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
| `generate` | Empty placeholder (generated reports — future) |

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
```
