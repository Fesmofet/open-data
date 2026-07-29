---
id: docs-apps-chain-indexer-spec-wallet-notifications
title: Wallet notification handlers (notify-only)
description: Hive L1 operations that emit notification events without wallet Postgres writes.
type: spec
status: active
scope: chain-indexer
tags: [chain-indexer, notifications, wallet]
updated_at: 2026-07-28
related:
  - docs/apps/notifications/spec/event-catalog.md
---

# Wallet notification handlers (notify-only)

Module: `apps/chain-indexer/src/domain/hive-wallet/`.

These handlers implement `HiveOperationHandler` and only call `NotificationEmitterService` — they do **not** insert into wallet history tables.

## Operations

| Hive operation | Notification type(s) |
|----------------|---------------------|
| `transfer` | `transfer_in`, `transfer_out` |
| `transfer_to_vesting` | `power_up` |
| `withdraw_vesting` | `power_down` |
| `claim_reward_balance` | `claim_reward` |
| `account_witness_vote` | `witness_vote` |
| `change_recovery_account` | `change_recovery_account` |
| `set_withdraw_vesting_route` | `withdraw_route` |
| `transfer_from_savings` | `transfer_from_savings` |
| `fill_order` | `fill_order` |

Constants: `HIVE_OPERATION` in `apps/chain-indexer/src/constants/hive-parser.ts`.

## Registration

Handlers are spread into `HIVE_OPERATION_HANDLERS` via `HiveWalletOperationHandlers` in `hive-operation-handlers.provider.ts`.

## Related

- `account_update` with `owner` → `change_password` in `AccountProfileUpdateService` (not in hive-wallet module).
- Hive Engine token ops → `engine_*` types in hive-engine parser.
