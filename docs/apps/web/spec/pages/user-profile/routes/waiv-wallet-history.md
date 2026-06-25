---
id: web-pages-user-profile-routes-waiv-wallet-history
title: WAIV wallet transaction history
description: Row mapping rules for WAIV wallet history on the transfers tab.
type: spec
status: active
scope: web
tags: [web, page, user-profile, wallet, waiv]
updated_at: 2026-06-25
related:
  - docs/apps/web/spec/pages/user-profile/routes/transfers.md
  - docs/apps/query-api/spec/user-waiv-wallet-endpoint.md
---

# WAIV wallet transaction history

**Back:** [transfers route](transfers.md) · **API:** [user-waiv-wallet-endpoint.md](../../../../query-api/spec/user-waiv-wallet-endpoint.md)

## Data flow

`POST /api/users/{name}/wallet/waiv/history` (BFF) → `POST /query/v1/users/{name}/wallet/waiv/history` → merged RPC + PG rows → `buildWaivWalletHistoryRowView` → `WaivWalletHistoryRow`.

## Operation → kind → label

| RPC / PG operation | `kind` | Primary label (i18n) |
|--------------------|--------|----------------------|
| `tokens_transfer` | `transfer` | Received / Transferred + counterparty |
| `tokens_stake` | `power_up` | `power_up` |
| `tokens_unstakeStart` | `power_down_start` | `power_down_started` |
| `tokens_unstakeDone` | `power_down_done` | `power_down_stopped` |
| `tokens_cancelUnstake` | `power_down_stop` | `canceled_power_down` |
| `tokens_delegate` | `delegate` | `delegation_from` / `delegated_to` |
| `tokens_undelegateStart` | `undelegate_start` | `undelegated` |
| `tokens_undelegateDone` | `undelegate_done` | `undelegated_completed` |
| `market_buy` / `market_sell` (+ remaining) | `market_trade` / `market_partial` | `bought` / `sold` + counterparty |
| `market_placeOrder` | `market_order` | Limit: `limit_order_to_*`; market: `market_order_to_*` |
| `market_cancel` | `market_cancel` | `cancel_order_to_*` |
| `market_expire` | `market_expire` | `market_expired_to_*` |
| `market_close` | `market_close` | `market_close_to_*` |
| `tokens_issue` | `mining` | `mining_rewards` |
| `mining_lottery` | `lottery` | `waiv_mining_lottery` |
| `hivepegged_buy` / `withdraw` | `pegged_deposit` / `pegged_withdraw` | pegged labels |
| `comments_authorReward` | `author_reward` | `author_rewards` + post link |
| `comments_curationReward` | `curation_reward` | `curator_rewards` + full `authorperm` link |
| `comments_beneficiaryReward` | `beneficiary_reward` | `curator_rewards` + post link + `(comment)` |
| `marketpools_swapTokens` | `swap` | `swap` |
| `airdrops_newAirdrop` | `airdrop` | `waiv_airdrop` |

## Amount display rules

- **WAIV** liquid amounts use green/red +/- by direction (transfer, market, rewards, swap legs).
- **WP** for stake/delegate/undelegate/airdrop display (legacy power symbol).
- **Formatting:** `formatWalletHistoryQuantity` — trim trailing zeros; `|value| >= 1` → 3 dp with grouping; sub-unit with leading zeros → compact 2 sig digits (e.g. `0.00026163` → `0.00026`); max 8 dp for WAIV precision.
- **Market trade rate:** `{price} per WAIV` under timestamp; price = `quantityHive / quantityTokens` (string math, 8 dp).
- **Swap rate:** `{rate} {symbolOut} per {symbolIn}` under timestamp (string divide, 3 dp display).
- **Limit place order:** `{locked} {symA} → {qty} {symB}`; footer `{price} per {symbol}`. Buy locks SWAP.HIVE; sell locks WAIV.
- **Transfer memo:** plain text, `break-all text-caption text-muted` (no HTML).

## Client behavior

- Unknown account (`404` from query-api) → empty history (not unavailable).
- Hive Engine RPC down on first page with no PG rows → `503` / `unavailable`.
- Checkbox **Show author and curators rewards** disabled while refetching; default off.
- Infinite scroll stops after one empty page even if `hasMore` is true.

## Verification

```bash
pnpm nx test web --testPathPatterns=waiv-wallet-history
pnpm nx run web:typecheck
```

Manual: `/@:name/transfers?type=WAIV` — limit/market orders, cancel/expire/close, rewards, swap rates, page 2 with PG swaps.
