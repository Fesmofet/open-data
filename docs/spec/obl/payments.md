---
id: obl-payments
title: OBL payments
description: Token transfers, upvote rewards, off-chain declare/confirm — all USD netting.
type: spec
status: active
scope: platform
tags: [obl, payments]
updated_at: 2026-07-14
related:
  - docs/spec/open-business-layer.md
  - docs/spec/obl/mutual-ledger.md
---

# Payments

All netting in **USD**. On-chain rows store `token_symbol`, `token_amount`, `rate_usd` for audit.

## On-chain (auto `confirmed`)

| Method | Source |
|--------|--------|
| `token_transfer` | Hive Engine `tokens/transfer` (WAIV MVP) |
| `upvote_reward` | `comments` `curationReward` — voter pays post author |

USD rate: WAIV → `hive_engine_rates`; other symbols → `hive_engine_swap_pool_usd`.

Pair-match ledger required; cutoff after ledger start.

## Off-chain

| Action | Signer | State |
|--------|--------|-------|
| `payment_declare` | payer | `pending` |
| `payment_confirm` | receiver | `confirmed` (partial remainders stay `pending`) |

Receiver-only confirm (no prior declare) allowed.

## USD → WAIV utility

`GET /query/v1/obl/convert/usd-to-waiv?amountUsd=` — live read via stored `hive_engine_rates`.
