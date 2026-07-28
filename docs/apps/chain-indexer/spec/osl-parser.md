---
id: docs-apps-chain-indexer-spec-osl-parser
title: Open Social Layer (OSL) parser
description: Hive custom_json envelope parser for social and wallet-adjacent OSL events.
type: spec
status: active
scope: chain-indexer
tags: [chain-indexer, osl, custom-json]
updated_at: 2026-07-28
related:
  - docs/apps/chain-indexer/spec/overview.md
  - docs/apps/chain-indexer/spec/osl-hive-engine-deposit.md
---

# Open Social Layer (OSL) parser

**Back:** [chain-indexer overview](overview.md)

## Purpose

OSL is a Hive `custom_json` envelope layer (same dispatch pattern as ODL/OBL): `{ events: [{ action, v, payload }] }`.

- **custom_json id:** `osl-mainnet` / `osl-testnet` (from `ODL_NETWORK`)
- **Code:** `apps/chain-indexer/src/domain/osl-parser/`

New actions are added as handler classes implementing `OdlActionHandler`; register in `OslCustomJsonParser` handler map.

## Actions

| Action | Spec |
|--------|------|
| `hive_engine_deposit` | [osl-hive-engine-deposit.md](osl-hive-engine-deposit.md) |
