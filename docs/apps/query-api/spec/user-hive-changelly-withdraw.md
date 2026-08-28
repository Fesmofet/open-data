---
id: query-api-user-hive-changelly-withdraw
title: User HIVE Changelly withdraw endpoints
description: Liquid HIVE → BTC/LTC/ETH withdraw via Changelly; query-api creates pay-in routing, web broadcasts L1 transfers.
type: spec
status: active
scope: query-api
tags: [query-api, wallet, hive, changelly]
updated_at: 2026-08-28
related:
  - docs/apps/query-api/spec/user-hive-wallet-endpoint.md
  - docs/apps/web/spec/pages/user-profile/routes/transfers.md
---

# User HIVE Changelly withdraw endpoints

Liquid HIVE → external crypto (BTC, LTC, ETH) via [Changelly](https://changelly.com/). query-api talks to Changelly; the **web client** broadcasts Hive L1 `transfer` operations after `create`.

## Environment

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `CHANGELLY_PRIVATE_KEY` | No | — | PKCS#8 DER private key for Changelly API v2 signing. When unset, Changelly calls fail → **503**. |
| `CHANGELLY_BASE_URL` | No | `https://api.changelly.com/v2` | Changelly JSON-RPC base URL |

## Limits (legacy parity)

| Rule | Value |
|------|-------|
| Output coins | `btc`, `ltc`, `eth` |
| USD cap per withdrawal | $100 (HIVE amount × live HIVE/USD) |
| Tracking self-transfer | `0.001 HIVE` memo with Changelly track URL (requires extra liquid balance) |
| Refund address | Profile account name (Hive account) |

## Range

`GET /query/v1/users/:name/wallet/hive/withdraw/range?outputCoinType=btc|ltc|eth`

Returns Changelly pair min/max for HIVE → output coin and a reference rate (`1 HIVE` → output amount).

Response:

```json
{ "min": "10", "max": "5000", "rate": "0.00001234" }
```

## Estimate

`POST /query/v1/users/:name/wallet/hive/withdraw/estimate`

Body: `{ "amount": 50, "outputCoinType": "btc" }`

Returns predicted receive amount: `{ "result": "0.00012345" }`.

## Create

`POST /query/v1/users/:name/wallet/hive/withdraw/create`

Body: `{ "amount": 50, "outputCoinType": "btc", "address": "<destination>" }`

Validates:

- `accounts_current` row exists
- Liquid HIVE ≥ amount
- Liquid HIVE ≥ amount + 0.001 (tracking reserve)
- USD cap ($100)
- Changelly pair min/max

Creates Changelly transaction and returns pay-in routing for client broadcast:

```json
{
  "receiver": "changelly-payin",
  "memo": "…",
  "exchangeId": "…",
  "amount": 50,
  "outputAmount": "0.00012345",
  "trackUrl": "https://…"
}
```

Web builds **two** L1 transfers:

1. `amount` HIVE → `receiver` with Changelly `memo`
2. `0.001 HIVE` self-transfer with `trackUrl` memo

## Errors

| Status | When |
|--------|------|
| `400` | Unsupported coin, insufficient balance, USD cap, amount outside pair limits |
| `404` | No `accounts_current` row for `name` |
| `503` | Changelly unavailable, missing/disabled API key, Hive node unavailable |

## MCP

| Tool | HTTP equivalent |
|------|-----------------|
| `get_user_hive_withdraw_range` | `GET .../withdraw/range` |
| `post_user_hive_withdraw_estimate` | `POST .../withdraw/estimate` |

**`create` is not exposed via MCP** — client must sign and broadcast transfers.

## Verification

```bash
pnpm nx test query-api --testPathPatterns=hive-changelly-withdraw
curl -s "http://localhost:3001/query/v1/users/alice/wallet/hive/withdraw/range?outputCoinType=btc" | jq .
curl -s -X POST "http://localhost:3001/query/v1/users/alice/wallet/hive/withdraw/estimate" \
  -H 'Content-Type: application/json' \
  -d '{"amount":10,"outputCoinType":"btc"}' | jq .
```
