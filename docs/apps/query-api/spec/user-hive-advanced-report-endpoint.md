---
id: query-api-user-hive-advanced-report-endpoint
title: Hive advanced report endpoints
description: "Multi-account Hive L1 advanced wallet report with historical fiat and viewer exemptions."
type: spec
status: active
scope: query-api
tags: [query-api, wallet, hive, advanced-report]
updated_at: 2026-06-22
related:
  - docs/apps/query-api/spec/user-hive-wallet-endpoint.md
  - docs/apps/web/spec/pages/user-profile/routes/transfers-table.md
---

# Hive advanced report endpoints

## `POST /query/v1/wallet/hive/advanced-report`

Multi-account Hive wallet table for `/@:name/transfers/table`.

### Authentication and authorization

Requires **`Authorization: Bearer <access_token>`** where the token is an **access** JWT from **auth-api** (`typ: access`, subject `sub` = Hive account name). **query-api** must use the **same `JWT_SECRET`** as auth-api.

Optional body field **`viewer`** loads exemption `checked` flags for that viewer. If `viewer` is sent, it must match the token subject (comparison is **trim + case-insensitive**). If the token is valid but `viewer` ≠ `sub`, the API returns **403 Forbidden**.

### Request body

| Field | Type | Notes |
|-------|------|-------|
| `accounts` | `{ name, cursor? }[]` | Min 1; only accounts with `hasMore: true` from the previous response should be sent on the next request |
| `filterAccounts` | `string[]` | Min 1; used for mutual-transaction exclusion |
| `startDate` | unix UTC | Inclusive lower bound |
| `endDate` | unix UTC | Inclusive upper bound; must be `< now` |
| `limit` | int 1–50 | Default 50 |
| `currency` | fiat code | One of `SUPPORTED_CURRENCIES` |
| `viewer` | string? | Loads exemption `checked` flags for this viewer (must match JWT `sub` when set) |

### Per-account cursor (legacy `accumulateHiveAcc`)

After each page, for each account:

1. **`filterWallet`** = account rows from `pagingRows` that are **not** in the globally merged top-`limit` page.
2. If `filterWallet.length > 0` → next **`cursor` = `filterWallet[0].operationIndex`**.
3. Else → next **`cursor` = last(pagingRows).operationIndex - 1`** (`pagingRows` is newest-first).

`pagingRows` includes a limit+1 lookahead row when more history exists.

### Response

| Field | Type | Notes |
|-------|------|-------|
| `wallet` | row[] | Sorted by `timestamp` desc |
| `accounts` | `{ name, cursor, hasMore }[]` | **Only accounts with `hasMore: true`** (exhausted accounts omitted) |
| `hasMore` | boolean | Global merge has more rows **or** any account has more history |
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
| 400 | Invalid date range or body |
| 401 | Missing or invalid Bearer token |
| 403 | `viewer` does not match token subject |
| 503 | Hive RPC unavailable |

## `POST /query/v1/wallet/hive/exemptions`

Toggle a viewer exemption (excluded from deposit/withdraw totals).

Requires **`Authorization: Bearer <access_token>`** (same as advanced-report). Body **`viewer`** must match JWT `sub` (trim + case-insensitive) or **403**.

| Field | Type |
|-------|------|
| `viewer` | string |
| `account` | string |
| `operationIndex` | int |
| `checked` | boolean — `true` upserts, `false` deletes |

Storage: Postgres `wallet_exemptions` (`viewer`, `account`, `operation_index` unique).

Web BFF also enforces session auth and forwards Bearer to query-api.

### Errors

| Status | When |
|--------|------|
| 400 | Invalid body |
| 401 | Missing or invalid Bearer token |
| 403 | `viewer` does not match token subject |

## MCP tools

- `post_hive_advanced_report`
- `post_hive_wallet_exemption`

## Manual QA

- Single account + date range → rows and totals
- Long range (e.g. `flowmaster` 2020–2026): row `hiveUsd` matches historical daily rate for that UTC date, not current spot; deposits/withdrawals align with legacy when `currency_statistics` is backfilled
- Two filter accounts → mutual transfer visible, excluded from totals
- Exemption checkbox persists after reload
- Progressive auto-pagination: client loads all pages until `hasMore: false` (only `hasMore` accounts in subsequent requests)
- Currency switch recalculates server-side
- Missing Bearer → 401; `viewer` mismatch → 403
- Hive node down → 503
