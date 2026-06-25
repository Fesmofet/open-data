---
id: query-api-user-waiv-wallet-endpoint
title: User WAIV wallet summary
description: Live Hive Engine WAIV balance snapshot for profile wallet tab.
type: spec
status: active
scope: query-api
tags: [query-api, wallet, waiv]
updated_at: 2026-06-25
related:
  - docs/apps/web/spec/pages/user-profile/routes/transfers.md
  - docs/apps/web/spec/pages/user-profile/routes/waiv-wallet-history.md
---

# User WAIV wallet summary

## Endpoints

### `GET /query/v1/users/{name}/wallet/waiv`

Returns live WAIV balances from Hive Engine `tokens.balances`, optional pending unstake metadata, and USD estimate from `CurrencyQueryService.engineLatestStored('WAIV')` (latest stored `hive_engine_rates` ordinary row; scheduler refreshes ~5 min — no live Hive Engine RPC on the read path).

### `GET /query/v1/users/{name}/wallet/engine/{symbol}/delegations`

Incoming (`to = name`) and outgoing (`from = name`) rows from Hive Engine `tokens.delegations`. Symbol is trimmed and uppercased. Each query is capped at **1000** rows (no pagination).

### `POST /query/v1/users/{name}/wallet/waiv/history`

Paginated WAIV wallet transaction history for the transfers tab. Merges three sources (legacy parity):

| Source | Content |
|--------|---------|
| Hive Engine `accountHistory` RPC | `symbol=WAIV`, ops from legacy `HISTORY_API_OPS`; optional reward ops when `showRewards=true` |
| PG `hive_engine_swaps` | Atomic `marketpools_swapTokens` rows where `symbol_in` or `symbol_out` is WAIV |
| PG `hive_engine_waiv_airdrops` | Historical `airdrops_newAirdrop` rows |

**Body:** `{ limit?: number; cursor?: string; showRewards?: boolean }` — default `showRewards=false`, `limit=20`.

**Response:** `{ items, cursor, hasMore }` — each item has `id`, `timestamp` (ISO), `operation`, `kind` (row classifier), `source` (`rpc` \| `swap` \| `airdrop`), `payload`.

**Payload enrichment (RPC):**

- `market_buy` / `market_sell` (+ remaining): when `price` is absent, set `price = quantityHive / quantityTokens` using string division (8 dp).
- `market_placeOrder`: when `quantity` is absent, `buy` → `quantity = quantityLocked / price`; `sell` → `quantity = quantityLocked * price` (8 dp string math).

**Row display:** see [waiv-wallet-history.md](../../web/spec/pages/user-profile/routes/waiv-wallet-history.md) for op → kind → label and amount formatting.

**Errors:** `404` unknown account; `400` invalid cursor; `503` when Hive Engine history RPC is unavailable and the first page has no PG rows. Web maps `404` to empty history; `503` to unavailable.

## Response (`wallet/waiv`)

| Field | Description |
|-------|-------------|
| `account` | Profile account from URL |
| `balance.*` | Raw Hive Engine quantity strings |
| `display.liquidWaiv` | Formatted liquid balance |
| `display.waivPower` | `stake + delegationsOut` |
| `display.delegationsNet` | Signed `delegationsIn - delegationsOut - pendingUndelegations` |
| `display.estAccountValueUsd` | `waivUsd * (liquid + stake + pendingUnstake + delegationsOut)` |
| `flags.showDelegationsRow` | Net delegations non-zero or pending undelegations |
| `flags.showPowerDownRow` | `pendingUnstake > 0` |
| `powerDown.nextUnstakeAt` | Unix **milliseconds** — minimum `nextTransactionTimestamp` from `tokens.pendingUnstakes` when power down active |
| `rates.waivHive` / `rates.waivUsd` | From `engineLatestStored` (DB); `0` when rates missing |

`powerDown` is omitted when `showPowerDownRow` is false.

## Display rules (legacy parity)

- **WAIV Power** = `stake + delegationsOut`
- **Delegations net** = `delegationsIn - delegationsOut - pendingUndelegations` (signed)
- **Est. account value USD** = `waivUsd * (liquid + stake + pendingUnstake + delegationsOut)`

## Errors

| HTTP | When |
|------|------|
| `404` | `name` absent from `accounts_current` |
| `503` | Hive Engine RPC failed (network, timeout, JSON-RPC error) — **not** returned for legitimately empty balance (`findOne` null with successful RPC) |
| `400` | Delegations: empty `symbol` after trim |

Web wallet tab maps `503` and network failures to `t('unavailable')` — never fake zero balances on infrastructure failure.

## MCP tools

- `get_user_waiv_wallet`
- `get_user_waiv_wallet_history`
- `get_user_engine_token_delegations`

See [mcp.md](mcp.md) catalog table.
