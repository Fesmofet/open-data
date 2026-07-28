---
id: docs-apps-chain-indexer-spec-osl-hive-engine-deposit
title: OSL hive_engine_deposit
description: Indexes deposit instruction records into hive_engine_deposit_records.
type: spec
status: active
scope: chain-indexer
tags: [chain-indexer, osl, hive-engine, wallet]
updated_at: 2026-07-28
related:
  - docs/apps/chain-indexer/spec/osl-parser.md
  - docs/spec/data-model/hive-engine-deposit-records.md
---

# OSL `hive_engine_deposit`

**Back:** [OSL parser](osl-parser.md) · **Table:** [hive_engine_deposit_records](../../../spec/data-model/hive-engine-deposit-records.md)

## Payload (v1)

| Field | Required | Notes |
|-------|----------|--------|
| `author` | yes | Must match posting signer |
| `destination` | yes | Profile account |
| `symbol_in`, `symbol_out` | yes | Deposit pair |
| `pair` | yes | Display label |
| `ex_rate` | yes | Quoted rate |
| `deposit_account` | xor `address` | Hive swap account |
| `address` | xor `deposit_account` | External address |
| `memo` | no | Transfer memo |

Handler: `HiveEngineDepositHandler`. Legacy `waivio_hive_engine` / `createDepositRecord` is **not** parsed — use Mongo import.
