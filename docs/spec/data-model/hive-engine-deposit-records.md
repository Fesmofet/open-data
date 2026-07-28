---
id: docs-spec-data-model-hive-engine-deposit-records
title: hive_engine_deposit_records
description: Hive Engine deposit instructions from OSL hive_engine_deposit and legacy Mongo createDepositRecord.
type: spec
status: active
scope: shared
tags: [hive-engine, wallet, osl, deposit]
updated_at: 2026-07-28
related:
  - docs/spec/data-model/schema.sql
  - docs/apps/chain-indexer/spec/osl-hive-engine-deposit.md
---

# hive_engine_deposit_records

**Back:** [schema.sql](schema.sql)

## Purpose

When a user opens Hive Engine deposit instructions in the app, Waivio records the **exact instructions shown** on-chain for dispute evidence.

- **New writes:** OSL `custom_json` (`osl-mainnet` / `osl-testnet`) envelope action `hive_engine_deposit` — indexed by chain-indexer.
- **Historical:** Legacy `waivio_hive_engine` / `createDepositRecord` rows imported from Mongo `EngineAccountHistory`.

query-api merges this table into ENGINE and WAIV wallet history (`kind: deposit_instruction`). Profile history queries match rows where **`account` or `destination`** equals the profile name (signer and destination usually match).

## Table

| Column | Description |
|--------|-------------|
| `account` | Hive posting signer |
| `transaction_id` | Hive transaction id |
| `ref_hive_block_number` | Hive L1 block number |
| `block_timestamp` | Event time |
| `destination` | Profile account the deposit is for |
| `symbol_in`, `symbol_out` | Deposit pair (e.g. `HIVE`, `SWAP.HIVE`) |
| `pair` | Display pair label |
| `ex_rate` | Quoted rate (UI applies 0.0075 fee offset for display) |
| `deposit_account` | Hive account to send to (XOR with `address`) |
| `address` | External-chain address (XOR with `deposit_account`) |
| `memo` | Required transfer memo when applicable |
| `symbols` | Generated `ARRAY[symbol_in, symbol_out]` for wallet tab filters |

**Unique:** `(transaction_id, account)`.

Schema migration: `00047_hive_engine_deposit_records`.

## Mongo import

```bash
mongoexport --collection=engineaccounthistories \
  --query='{"operation":"createDepositRecord"}' \
  --out=engine_deposit_records.json --jsonArray

pnpm migrate:mongo-hive-engine-deposit-records engine_deposit_records.json [--dry-run] [--skip-indexes]
```

## Query-api projection

- `operation`: `hive_engine_deposit`
- `kind`: `deposit_instruction`
- `source`: `deposit`
