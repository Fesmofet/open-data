---
id: docs-spec-data-model-hive-engine-waiv-airdrops
title: hive_engine_waiv_airdrops
description: Historical one-time WAIV airdrops imported from legacy Mongo EngineAccountHistory.
type: spec
status: active
scope: shared
tags: [hive-engine, wallet, waiv, airdrops]
updated_at: 2026-06-25
related:
  - docs/spec/data-model/schema.sql
  - docs/apps/chain-indexer/spec/hive-engine-swaps.md
---

# hive_engine_waiv_airdrops

**Back:** [schema.sql](schema.sql)

## Purpose

Legacy Waivio stored **WAIV airdrop** rows in Mongo `EngineAccountHistory` (`operation: airdrops_newAirdrop`). This was a **one-time campaign** — no new airdrops are planned and **no chain-indexer parser** indexes live airdrops.

Postgres table `hive_engine_waiv_airdrops` holds the historical archive for future query-api wallet / advanced report merge (with HE RPC history and [`hive_engine_swaps`](../../apps/chain-indexer/spec/hive-engine-swaps.md)).

## Table

| Column | Description |
|--------|-------------|
| `account` | Airdrop recipient |
| `transaction_id` | HE transaction id |
| `block_number` | HE block number |
| `ref_hive_block_number` | Referenced Hive L1 block |
| `block_timestamp` | Event time (from Mongo unix `timestamp`) |
| `quantity` | WAIV amount (exact string) |
| `token_state` | Legacy `tokenState` (e.g. `stake`, `liquid`) |

No `symbol` column — table is WAIV-only by definition.

**Unique:** `(transaction_id, account)` — one row per recipient per airdrop transaction.

Schema migration: `00029_hive_engine_waiv_airdrops`.

## Mongo import

```bash
mongoexport --collection=engineaccounthistories \
  --query='{"operation":"airdrops_newAirdrop","symbol":"WAIV"}' \
  --out=waiv_airdrops.json --jsonArray

pnpm migrate:mongo-hive-engine-waiv-airdrops waiv_airdrops.json [--dry-run] [--skip-indexes]
```

Import filters: `operation === airdrops_newAirdrop`, `symbol === WAIV`, required fields present. Idempotent via `ON CONFLICT (transaction_id, account) DO NOTHING`.

See [`scripts/migrate-mongo-to-pg/README.md`](../../scripts/migrate-mongo-to-pg/README.md).

## Future query-api projection

When merged into WAIV wallet / advanced report:

- `operation`: `airdrops_newAirdrop`
- `symbol`: `WAIV`
- `withdrawDeposit`: `d` (deposit only)

## Verification

```sql
SELECT * FROM hive_engine_waiv_airdrops
WHERE account = 'dp7'
  AND transaction_id = '000c37195fffc51a72f34c3221279eb21e66f746';
```
