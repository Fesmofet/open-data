---
id: query-api-user-waiv-wallet-endpoint
title: User WAIV wallet summary
description: Live Hive Engine WAIV balance snapshot for profile wallet tab.
type: spec
status: active
scope: query-api
tags: [query-api, wallet, waiv]
updated_at: 2026-06-19
related:
  - docs/apps/web/spec/pages/user-profile/routes/transfers.md
---

# User WAIV wallet summary

## Endpoints

### `GET /query/v1/users/{name}/wallet/waiv`

Returns live WAIV balances from Hive Engine `tokens.balances`, optional pending unstake metadata, and USD estimate from `CurrencyQueryService.engineCurrent('WAIV')`.

### `GET /query/v1/users/{name}/wallet/engine/{symbol}/delegations`

Incoming (`to = name`) and outgoing (`from = name`) rows from Hive Engine `tokens.delegations`. Symbol is trimmed and uppercased. Each query is capped at **1000** rows (no pagination).

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
| `rates.waivHive` / `rates.waivUsd` | From `engineCurrent`; `0` when rates missing |

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
- `get_user_engine_token_delegations`

See [mcp.md](mcp.md) catalog table.
