---
id: query-api-user-hive-advanced-report-endpoint
title: Hive advanced report endpoints
description: "Multi-account Hive L1 advanced wallet report with historical fiat and viewer exemptions."
type: spec
status: active
scope: query-api
tags: [query-api, wallet, hive, advanced-report]
updated_at: 2026-06-23
related:
  - docs/apps/query-api/spec/user-hive-wallet-endpoint.md
  - docs/apps/web/spec/pages/user-profile/routes/transfers-table.md
---

# Hive advanced report endpoints

## `POST /query/v1/wallet/hive/advanced-report`

Multi-account Hive wallet table for `/@:name/transfers/table`.

### Request body

| Field | Type | Notes |
|-------|------|-------|
| `accounts` | `{ name, cursor? }[]` | Min 1; resume `cursor` = oldest **displayed** row’s `operationIndex - 1` (not the limit+1 lookahead) |
| `filterAccounts` | `string[]` | Min 1; used for mutual-transaction exclusion |
| `startDate` | unix UTC | Inclusive lower bound |
| `endDate` | unix UTC | Inclusive upper bound; must be `< now` |
| `limit` | int 1–50 | Default 50 |
| `currency` | fiat code | One of `SUPPORTED_CURRENCIES` |
| `viewer` | string? | Loads exemption `checked` flags for this viewer |

### Response

| Field | Type | Notes |
|-------|------|-------|
| `wallet` | row[] | Sorted by `timestamp` desc |
| `accounts` | `{ name, cursor, hasMore }[]` | Per-account pagination cursors |
| `hasMore` | boolean | Any account has more rows |
| `deposits` / `withdrawals` | number | Totals in selected fiat; skip `checked` and `withdrawDeposit === ''` |

Rows include server-computed `hiveRateFiat` / `hbdRateFiat` (unit rates in selected fiat for that row’s UTC date — legacy `hive${currency}` / `hbd${currency}` columns), `totalFiat`, and amount columns. Clients must not re-price totals.

Table columns `HIVE/{currency}` and `HBD/{currency}` display **unit exchange rates**, not row hive/hbd fiat amounts.

### Historical pricing

Per-row fiat uses the operation **UTC calendar date** (`timestamp` → `YYYY-MM-DD`):

1. **HIVE / HBD USD** — `currency_statistics` daily rows (`is_daily = true`), keyed by `(created_at AT TIME ZONE 'UTC')::date`.
2. **Exact day missing** — nearest prior daily rate (carry-back); if the date is before the first daily row, nearest next daily rate (carry-forward).
3. **Today** — current spot from `CurrencyQueryService.marketInfo` (not the daily aggregate row).
4. **Fiat cross** — `currency_rates` for `base = USD`, with forward-fill for gaps (same pattern as legacy campaigns-api).

If no daily rate can be resolved for a past date, `hiveUsd` / `hbdUsd` are `0` and a server warning is logged — **current spot is never used as a fallback for historical dates**.

**Data dependency:** accurate totals for multi-year ranges require daily `currency_statistics` history (legacy Mongo export via `pnpm migrate:mongo-currency`, plus scheduler `currency-coingecko-daily` going forward). Without backfilled daily rows, totals will be understated.

Existing indexes are sufficient for range lookups: `currency_statistics (is_daily, created_at)` and `currency_rates (base, date)`.

### Operation allowlist

`transfer`, `transfer_to_vesting`, `claim_reward_balance`, `limit_order_cancel`, `fill_order`, `proposal_pay`, `fill_vesting_withdraw`, `interest`.

Mutual transfers between `filterAccounts` remain visible but get `withdrawDeposit: ''` and are excluded from totals.

Optional env `HIVE_SWAP_ACCOUNT` (default `honey-swap`, legacy `SWAP_HIVE_ACC`): skip `transfer` rows involving that account.

### Errors

| Status | When |
|--------|------|
| 400 | Invalid date range |
| 503 | Hive RPC unavailable |

## `POST /query/v1/wallet/hive/exemptions`

Toggle a viewer exemption (excluded from deposit/withdraw totals).

| Field | Type |
|-------|------|
| `viewer` | string |
| `account` | string |
| `operationIndex` | int |
| `checked` | boolean — `true` upserts, `false` deletes |

Storage: Postgres `wallet_exemptions` (`viewer`, `account`, `operation_index` unique).

Web BFF enforces auth: `viewer` must match session user.

## MCP tools

- `post_hive_advanced_report`
- `post_hive_wallet_exemption`

## Manual QA

- Single account + date range → rows and totals
- Long range (e.g. `flowmaster` 2020–2026): row `hiveUsd` matches historical daily rate for that UTC date, not current spot; deposits/withdrawals align with legacy when `currency_statistics` is backfilled
- Two filter accounts → mutual transfer visible, excluded from totals
- Exemption checkbox persists after reload
- Load more preserves filters and per-account cursors
- Currency switch recalculates server-side
- Hive node down → 503
