---
id: open-business-layer
title: Open Business Layer (OBL)
description: Normative overview of OBL — catalog, on-chain contracts, Mutual Ledger, USD balances.
type: spec
status: active
scope: platform
tags: [obl, business-layer]
updated_at: 2026-07-14
related:
  - docs/spec/obl/mutual-ledger.md
  - docs/spec/obl/contracts.md
  - docs/spec/obl/payments.md
  - docs/spec/obl/disputes.md
  - docs/apps/chain-indexer/spec/obl-parser.md
  - docs/apps/query-api/spec/obl.md
---

# Open Business Layer (OBL)

Waivio indexes OBL on-chain history and computes per-pair **Mutual Ledger** balances in USD. Waivio is **not** escrow, settlement agent, or default arbitrator.

## Two discovery paths

1. **ODL catalog** — collaborative `service_offered` / `service_requested` / `legal_document` objects under `odl-mainnet` (discover/search unchanged).
2. **Published offers** — `obl_offers` rows with own `name` / `description` / `tags` (search via query-api). `service_ref` is optional.

## Lifecycle

`draft` (off-chain, query-api) → `offer_publish` → `contract_sign` → invoices / payments / disputes.

Drafts are editable off-chain (`obl_offer_drafts`). Publishing freezes a version on-chain.

## Custom JSON ids

| Network | Id |
|---------|-----|
| Mainnet | `obl-mainnet` |
| Testnet | `obl-testnet` |

Catalog ODL objects remain on `odl-mainnet` / `odl-testnet`.

## Feature specs

| Doc | Topic |
|-----|--------|
| [mutual-ledger.md](obl/mutual-ledger.md) | Per-pair USD balance, states, cutoff |
| [contracts.md](obl/contracts.md) | Offers, contracts, invoices |
| [payments.md](obl/payments.md) | On-chain WAIV, upvote rewards, off-chain |
| [disputes.md](obl/disputes.md) | Dispute open/resolve rules |

## App specs

| App | Doc |
|-----|-----|
| chain-indexer | [obl-parser.md](../apps/chain-indexer/spec/obl-parser.md) |
| query-api | [obl.md](../apps/query-api/spec/obl.md) |
