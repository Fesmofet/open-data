---
id: docs-apps-chain-indexer-spec-hive-engine-swaps
title: Hive Engine swaps
description: Indexes atomic marketpools swapTokens rows from HE transaction logs into hive_engine_swaps.
type: feature
status: active
scope: chain-indexer
tags: [chain-indexer, hive-engine, swaps, wallet]
updated_at: 2026-06-25
related:
  - docs/apps/chain-indexer/spec/overview.md
  - docs/spec/data-model/schema.sql
---

# Hive Engine swaps

**Back:** [chain-indexer overview](overview.md)

## Purpose

Hive Engine `accountHistory` RPC exposes `marketpools_swapTokens` as **separate per-token legs**, without `symbolIn` / `symbolOut` on a single row. Legacy Waivio stored **atomic swaps** in Mongo `EngineAccountHistory`, parsed from transaction logs.

chain-indexer writes the same atomic shape to Postgres table `hive_engine_swaps` for wallet history and advanced report consumers (query-api — future).

## Data source

- **Contract:** `marketpools`
- **Action:** `swapTokens`
- **Log events required:**
  - `swapTokens` → `symbolIn`, `symbolOut`, optional `poolId`
  - `transferFromContract` → `symbolOutQuantity` (legacy mapping)
  - `transferToContract` → `symbolInQuantity`

Implementation: [`MarketpoolsSwapParser`](../../../../apps/chain-indexer/src/domain/hive-engine-parser/parsers/marketpools-swap.parser.ts), util [`marketpools-swap.util.ts`](../../../../apps/chain-indexer/src/domain/hive-engine-parser/marketpools-swap.util.ts).

**Out of scope:** `balanceBeforeRebalancing` rows, airdrops, grey-list side effects.

## Table: `hive_engine_swaps`

| Column | Description |
|--------|-------------|
| `account` | Swap sender (`transaction.sender`) |
| `transaction_id` | HE transaction id |
| `block_number` | HE block number |
| `ref_hive_block_number` | Referenced Hive L1 block |
| `block_timestamp` | HE block time |
| `symbol_out`, `symbol_in` | Swap pair from `swapTokens` event |
| `symbol_out_quantity`, `symbol_in_quantity` | Exact string quantities from transfer events |
| `pool_id` | Optional pool id from logs |
| `symbols` | Generated `ARRAY[symbol_in, symbol_out]` for GIN filtering |

**Unique:** `(transaction_id, account)` — idempotent re-parse and Mongo import.

Migration: `00027_hive_engine_swaps`.

## Query patterns

```sql
-- WAIV wallet swaps for account
SELECT * FROM hive_engine_swaps
WHERE account = $1
  AND symbols @> ARRAY['WAIV']::text[]
ORDER BY block_timestamp DESC, id DESC
LIMIT $2;

-- Exclude symbols (legacy excludeSymbols)
AND NOT (symbols && ARRAY['SWAP.HIVE']::text[])
```

Withdraw/deposit when filtering by token (legacy advanced wallet):

- `symbol_out = $token` → withdrawal
- `symbol_in = $token` → deposit

## Mongo import

One-off data migration from legacy `EngineAccountHistory`:

```bash
mongoexport --collection=engineaccounthistories \
  --query='{"operation":"marketpools_swapTokens"}' \
  --out=engine_swaps.json --jsonArray

pnpm migrate:mongo-hive-engine-swaps engine_swaps.json [--dry-run] [--skip-indexes]
```

See [`scripts/migrate-mongo-to-pg/README.md`](../../../../scripts/migrate-mongo-to-pg/README.md).

## Verification

| Command | Purpose |
|---------|---------|
| `pnpm nx test chain-indexer --testPathPattern=marketpools-swap` | Parser + util unit tests |
| `pnpm migrate` | Apply `00027_hive_engine_swaps` |
