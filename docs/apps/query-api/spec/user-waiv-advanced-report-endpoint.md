---
id: query-api-user-waiv-advanced-report-endpoint
title: WAIV advanced report endpoint
description: "Multi-account WAIV advanced wallet report with Hive Engine history, historical fiat, and shared viewer exemptions."
type: spec
status: active
scope: query-api
tags: [query-api, wallet, waiv, advanced-report]
updated_at: 2026-06-26
related:
  - docs/apps/query-api/spec/user-hive-advanced-report-endpoint.md
parent: query-api-overview
---

# WAIV advanced report endpoint

## `POST /query/v1/wallet/waiv/advanced-report`

Multi-account WAIV wallet table: merges Hive Engine `accountHistory` RPC with Postgres `hive_engine_swaps` (optional) and `hive_engine_waiv_airdrops`.

Requires **`Authorization: Bearer <access_token>`**. Optional body **`viewer`** loads exemption `checked` flags for that viewer. If `viewer` is sent, it must match the token subject (comparison is **trim + case-insensitive**). If the token is valid but `viewer` ≠ `sub`, the API returns **403 Forbidden**.

### Body (highlights)

| Field | Notes |
|-------|-------|
| `accounts[]` | `{ name, cursor? }` — `cursor` is opaque base64url string |
| `filterAccounts` | Mutual txs between these accounts excluded from totals |
| `startDate` / `endDate` | Both or neither (browse vs filtered report) |
| `includeSwapsAndTrades` | Default **`false`** — when false, excludes PG swaps and RPC market buy/sell |
| `limit` | Default 50, max per `@opden-data-layer/core/waiv-advanced-report` |
| `currency` | Fiat column for WAIV/{currency} rate and totals |
| `viewer` | string? — loads exemption `checked` flags (must match JWT `sub` when set) |

### Response

`wallet[]` rows with `waivAmount`, `wpAmount`, `waivRateFiat`, `totalFiat`, `withdrawDeposit`, `checked`, etc.

`accounts[]` per-account `{ name, cursor, hasMore }` for pagination.

Rows with `checked: true` are excluded from `deposits` / `withdrawals` totals (same as Hive).

## Exemptions

WAIV reuses the Hive exemptions endpoint and storage.

### `POST /query/v1/wallet/hive/exemptions`

Toggle a viewer exemption (excluded from deposit/withdraw totals).

Requires **`Authorization: Bearer <access_token>`** (same as advanced-report). Body **`viewer`** must match JWT `sub` (trim + case-insensitive) or **403**.

| Field | Type |
|-------|------|
| `viewer` | string |
| `account` | string |
| `operationIndex` | int |
| `checked` | boolean — `true` upserts, `false` deletes |

Storage: Postgres `wallet_exemptions` (`viewer`, `account`, `operation_index` unique).

Web BFF: `POST /api/wallet/hive/exemptions` (session required; forwards Bearer to query-api).

### WAIV `operationIndex` contract

Unlike Hive L1 rows (chain `operationIndex` from the indexer), each WAIV row gets a **deterministic FNV-1a hash** (`stableWaivAdvancedReportOperationIndex` in `libs/core/src/waiv-advanced-report/stable-operation-index.ts`):

```
hash(source, account, timestamp, tieId)
```

`tieId` is built in `apps/query-api/src/domain/wallet/waiv-wallet-history-item-dtos.ts` (`buildRpcHistoryTieId`):

| Row kind | `tieId` formula |
|----------|-----------------|
| Reward (has `authorperm`) | `txId:op:authorperm:quantity` |
| Transfer (has `from`/`to`) | `txId:op:from:to:quantity` |
| Quantity only | `txId:op:quantity` |
| Fallback | `txId:op` |
| PG swap / airdrop | DTO id (`swap:42`, `airdrop:7`) |

**Stability contract:** any change to `tieId` rules or hash inputs is a **breaking change** for saved exemptions. Users must re-toggle rows after such a deploy.

Golden indices are locked in `libs/core/src/waiv-advanced-report/waiv-advanced-report.spec.ts` (contract tests).

### Breaking change (this release)

`tieId` disambiguation was added for reward rows (same `transactionId` + operation) and same-amount transfers in one transaction. Exemptions saved **before** this deploy on the WAIV table use old hash values and **no longer match**. The UI shows those rows unchecked; orphan rows in `wallet_exemptions` are harmless and are not cleaned up automatically.

Hive table exemptions are **not** affected (different `operationIndex` source).

### Shared storage note

Hive L1 indices and WAIV hashes share one table with no `wallet_type` column. A hash collision with a Hive L1 index on the same `(viewer, account)` is unlikely but theoretically possible; not addressed in this release.

### Exemption errors

| Status | When |
|--------|------|
| 400 | Invalid body |
| 401 | Missing or invalid Bearer token |
| 403 | `viewer` does not match token subject |

## Manual QA

- Single account + date range → rows and totals
- Long range (e.g. `grampo`): deposits/withdrawals align with legacy CSV when pagination is complete
- Two filter accounts → mutual transfer visible, excluded from totals
- **Exemptions (WAIV):** logged-in viewer on `/@grampo/transfers/waiv-table` → Submit → toggle row → reload → row still checked; toggle off → reload → unchecked and totals updated
- Logged-out → exemption checkbox hidden
- **Regression:** Hive table exemptions on the same viewer/account still work; toggling a Hive row does not affect WAIV rows

## Verification

```bash
pnpm nx test core --testPathPatterns=waiv-advanced-report
pnpm nx test query-api --testPathPatterns=waiv-advanced-report
```
