---
id: obl-contracts
title: OBL contracts lifecycle
description: Offers, contracts, invoices — on-chain actions and tables.
type: spec
status: active
scope: platform
tags: [obl, contracts]
updated_at: 2026-07-14
related:
  - docs/spec/open-business-layer.md
---

# Contracts lifecycle

## Tables

- `obl_offers` — versioned templates (`PK offer_id, version`)
- `obl_contracts` — signed instances (1 offer : many contracts)
- `obl_invoices` — USD obligations
- `obl_offer_drafts` — off-chain drafts (query-api only)

## Actions (`obl-mainnet` / `obl-testnet`)

| Action | Signer | Effect |
|--------|--------|--------|
| `offer_publish` | `author` | New offer version |
| `offer_update` | `author` | Append version |
| `offer_retire` | `author` | Mark retired |
| `contract_sign` | counterparty (`signer`) | Create contract; may start ledger |
| `invoice_issue` | `issuer` | Invoice; `pending` if no ledger yet |

Invoice before contract: `state=pending` until pair ledger exists, then promoted to `confirmed`.

## Drafts

`GET/POST/PATCH/DELETE /query/v1/users/:author/obl-drafts` (JWT). Publish via `offer_publish` broadcast, not via query-api.
