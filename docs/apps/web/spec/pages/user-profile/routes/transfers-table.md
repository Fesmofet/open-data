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

## Authentication

Report fetch requires a logged-in session. BFF `POST /api/wallet/hive/advanced-report` returns **401** without session cookie; **403** when body `viewer` ≠ session user. Forwards Bearer access JWT to query-api (same pattern as editor drafts).

## Data flow

1. RSC page builds default request (profile account, last 30 UTC days, USD); initial table state is empty until Submit.
2. Client table posts to BFF `POST /api/wallet/hive/advanced-report` for filter submit and progressive pagination.
3. Exemption toggles post to `POST /api/wallet/hive/exemptions` (auth required; viewer must match session).

Fiat amounts come from query-api only — no client-side rate math.

## UI

- Filters: start/till date, **user search** (multi-account chips), base currency
- **From account creation** link under From date — sets start to earliest creation date among selected filter accounts (or profile account when none selected); BFF `POST /api/wallet/hive/account-created-dates` → query-api tiered resolve (DB → `get_accounts` → `account_created` history)
- Submit loads **all pages automatically** until `hasMore` is false (legacy parity; no manual Show more)
- Page size **50** (shared `@opden-data-layer/core` constant)
- Virtual scroll tbody (`@tanstack/react-virtual`, sticky header)
- Partial-load warning when client page cap (`MAX_PROGRESSIVE_PAGES`) is hit (`truncated` flag)
- Disclaimer: `multiple_accounts_included`, `x_field_description`, `disclaimer_info`
- Legacy totals line: Deposits / Withdrawals (only after Submit), Export to .CSV
- Columns: X, Date, HIVE, HP, HBD, HIVE/{currency}, HBD/{currency}, ±, Account, Description, Memo
- Link from HIVE wallet tab (`table_view`) on `/@:name/transfers?type=HIVE`

## Module paths

| Piece | Path |
|-------|------|
| Page | `apps/web/src/app/(app)/user-profile/[name]/(profile)/transfers/table/page.tsx` |
| Table | `apps/web/src/modules/user-wallet/presentation/components/hive/advanced-report/` |
| BFF | `apps/web/src/app/api/wallet/hive/advanced-report/route.ts` |

## Manual QA

See query-api spec manual QA checklist; verify navigation from wallet summary, exemption persistence, logged-out 401, and virtual scroll with long ranges.
