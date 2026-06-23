---
id: web-user-profile-transfers-table
title: Transfers table (advanced reports)
description: "HIVE L1 advanced wallet report at /@:name/transfers/table."
type: spec
status: active
scope: web
tags: [web, user-profile, wallet, hive, advanced-report]
updated_at: 2026-06-22
related:
  - docs/apps/web/spec/pages/user-profile/routes/transfers.md
  - docs/apps/query-api/spec/user-hive-advanced-report-endpoint.md
---

# Transfers table (advanced reports)

**Route:** `/@:name/transfers/table`

HIVE mainnet advanced wallet report (v1). Uses `(profile)/transfers/table` layout — **full-width single column** (no left/right rails, **no wallet submenu**).

Guest/demo and WAIV Engine reports are out of scope.

## Data flow

1. RSC page builds default request (profile account, last 30 UTC days, USD) via `getHiveAdvancedReportQuery`.
2. Client table posts to BFF `POST /api/wallet/hive/advanced-report` for filter submit and load-more.
3. Exemption toggles post to `POST /api/wallet/hive/exemptions` (auth required; viewer must match session).

Fiat amounts come from query-api only — no client-side rate math.

## UI

- Filters: start/till date, **user search** (multi-account chips), base currency
- Submit loads **all pages automatically** until `hasMore` is false (legacy parity; no manual Show more)
- Disclaimer: `multiple_accounts_included`, `x_field_description`, `disclaimer_info`
- Legacy totals line: Deposits / Withdrawals (only after Submit), Export to .CSV
- Columns: X, Date, HIVE, HP, HBD, HIVE/{currency}, HBD/{currency}, ±, Account, Description, Memo
- Link from HIVE wallet tab (`table_view`) on `/@:name/transfers?type=HIVE`

## Module paths

| Piece | Path |
|-------|------|
| Page | `apps/web/src/app/(app)/user-profile/[name]/(profile)/(main)/transfers/table/page.tsx` |
| Table | `apps/web/src/modules/user-wallet/presentation/components/hive/advanced-report/` |
| BFF | `apps/web/src/app/api/wallet/hive/advanced-report/route.ts` |

## Manual QA

See query-api spec manual QA checklist; verify navigation from wallet summary and exemption persistence.
