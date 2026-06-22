---
id: docs-apps-chain-indexer-spec-hive-delegations
title: Hive HP/RC delegations indexing
description: Index HP and RC delegation pairs from Hive operations into Postgres for query-api wallet modals.
type: spec
status: active
scope: chain-indexer
tags: [chain-indexer, hive-delegations, wallet]
updated_at: 2026-06-22
related:
  - docs/apps/chain-indexer/spec/overview.md
  - docs/apps/query-api/spec/user-hive-wallet-endpoint.md
  - docs/README.md
---

# Hive HP/RC delegations indexing

**Back:** [Overview](overview.md) · **Query API:** [user-hive-wallet-endpoint](../../query-api/spec/user-hive-wallet-endpoint.md)

## Purpose

Persist HP and RC delegation pairs in Postgres (`user_delegations`, `user_rc_delegations`) so query-api can serve wallet delegation modals without `database_api.find_vesting_delegations` (wrong for incoming HP lists).

Historical rows are backfilled via mongo import (`pnpm migrate:mongo-delegations`, `pnpm migrate:mongo-rc-delegations`); live updates come from chain-indexer.

## Wired operations

| Hive operation | Handler | Table |
|----------------|---------|-------|
| `delegate_vesting_shares` | `HiveHpDelegationService` | `user_delegations` |
| `custom_json` with `id: "rc"` and op `delegate_rc` | `HiveRcDelegationService` | `user_rc_delegations` |

Module: [`hive-delegation`](../../../../apps/chain-indexer/src/domain/hive-delegation/).

## HP (`delegate_vesting_shares`)

- Parse `vesting_shares` (`"X.XXXXXX VESTS"`) to a float.
- `0` → delete `(delegator, delegatee)` row.
- Otherwise upsert with `delegation_date` from block timestamp.
- Account names normalized to lowercase.

## RC (`custom_json` id `rc`)

Payload: `["delegate_rc", { from, delegatees, max_rc }]`.

- `max_rc === 0` → delete rows for `(delegator, delegatees[])`.
- Otherwise upsert per delegatee with `rc = max_rc`.

Outgoing RC lists remain live RPC in query-api (`rc_api`); only **incoming** RC is indexed here (legacy parity).

## Verification

| Command | Purpose |
|---------|---------|
| `pnpm nx test chain-indexer --testFile=apps/chain-indexer/src/domain/hive-delegation/hive-hp-delegation.service.spec.ts` | HP parser unit tests |
| `pnpm nx test chain-indexer --testFile=apps/chain-indexer/src/domain/hive-delegation/hive-rc-delegation.service.spec.ts` | RC parser unit tests |
| `pnpm migrate:mongo-delegations <delegations.json>` | Historical HP backfill |
| `pnpm migrate:mongo-rc-delegations <user_rc_delegations.json>` | Historical RC backfill |
