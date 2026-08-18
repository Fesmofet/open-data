---
id: query-api-user-engine-wallet-endpoint
title: User Hive Engine wallet
description: Live Hive Engine multi-token wallet summary and merged transaction history for the ENGINE transfers tab.
type: spec
status: active
scope: query-api
tags: [query-api, wallet, hive-engine]
updated_at: 2026-07-06
related:
  - docs/apps/web/spec/pages/user-profile/routes/transfers.md
  - docs/apps/web/spec/pages/user-profile/routes/engine-wallet-history.md
---

# User Hive Engine wallet

## Endpoints

### `GET /query/v1/users/{name}/wallet/engine`

Returns live Hive Engine token balances for the profile account:

| Field | Description |
|-------|-------------|
| `pinnedTokens` | Always three rows: `SWAP.HIVE`, `SWAP.LTC`, `SWAP.BTC` (zero balance when absent on chain) |
| `tokens` | Other tokens with liquid or staked balance ≥ `0.001`, excluding `WAIV` and pinned SWAP symbols |
| `powerEligibleTokens` | Staking-enabled tokens with any liquid or staked balance (no `0.001` display floor), excluding `ENGINE_WALLET_EXCLUDED_SYMBOLS` only — used for power up/down asset lists |
| `estimatedAccountValueUsd` | Sum of row `usdEstimate` values |
| `rates.hiveUsd` | HIVE/USD spot from currency market info |

**USD rules:**

- Pinned SWAP.* → `CurrencyQueryService.enginePoolsUsdCsv`
- Other tokens → `market.metrics.lastPrice` (in HIVE) × `rates.hiveUsd`

Each token row includes `unstakingCooldown` and `numberTransactions` from Hive Engine `tokens` metadata (defaults `0`). Power-down unlock preview in the web app uses `numberTransactions` for per-installment amount and `unstakingCooldown / numberTransactions` for period copy (7 days → “every week”; WAIV/HIVE L1 use fixed 4/13 weekly installments).

### `POST /query/v1/users/{name}/wallet/engine/history`

Paginated Hive Engine wallet history for `?type=ENGINE`. Merges:

| Source | Content |
|--------|---------|
| Hive Engine History API | All ops from legacy `HISTORY_API_OPS`; **WAIV rows filtered server-side** (history nodes ignore `excludeSymbols`) |
| PG `hive_engine_swaps` | All indexed `marketpools_swapTokens` rows for the account (including WAIV↔SWAP.* legs) |
| PG `hive_engine_deposit_records` | Deposit instructions where neither leg is WAIV (ENGINE tab filter) |

**Body:** `{ limit?: number; cursor?: string }` — default `limit=20`.

**Response:** `{ items, cursor, hasMore }` — each item has `source`: `rpc` \| `swap` \| `deposit` (no airdrops).

Row display rules: [engine-wallet-history.md](../../web/spec/pages/user-profile/routes/engine-wallet-history.md).

**Errors:** `404` unknown account; `400` invalid cursor; `503` when History API unavailable and first page has no PG rows.

## MCP tools

- `get_user_engine_wallet`
- `get_user_engine_wallet_history`

See [mcp.md](mcp.md) catalog table.
