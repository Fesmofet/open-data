---
id: obl-contracts
title: OBL contracts lifecycle
description: Offers, contracts, invoices — on-chain actions and tables.
type: spec
status: active
scope: platform
tags: [obl, contracts]
updated_at: 2026-07-16
related:
  - docs/spec/open-business-layer.md
---

# Contracts lifecycle

## Tables

- `obl_offers` — versioned templates (`PK offer_id, version`); `created_at`
- `obl_contracts` — signed instances (1 offer : many contracts); `created_at`, `metadata` JSONB
- `obl_invoices` — USD obligations; optional `contract_id` FK to contract; `created_at`
- `obl_offer_drafts` — off-chain drafts (query-api only)

## Actions (`obl-mainnet` / `obl-testnet`)

| Action | Signer | Effect |
|--------|--------|--------|
| `offer_publish` | `author` | New offer version |
| `offer_update` | `author` | Append version |
| `offer_retire` | `author` | Mark retired |
| `contract_sign` | counterparty (`signer`) | Create contract; may start ledger. **One contract per `offer_id` + account pair** (deterministic `contract_id`, unique index). Optional `metadata` JSONB. |
| `invoice_issue` | `issuer` | Invoice (`inv-{uuid}`); `pending` if no ledger yet. Optional `contract_id`, optional `details` JSONB (omitted when empty). |

Invoice before contract: `state=pending` until pair ledger exists, then promoted to `confirmed`.

Dispute resolution authority is read from the invoice's linked contract (`dispute_rule`, `arbiter`).

## `contract_sign` payload

- `contract_id` — web uses deterministic id: `contract-{offer_id}-{pair_low}-{pair_high}` (sorted accounts).
- `metadata` (optional) — initialization context (monitoring targets, governance object, etc.). Stored in `obl_contracts.metadata`.

## Offer `terms` extensions (on-chain in `terms` JSONB)

- `terms.termination` — `{ mode: 'instant' | 'notice', who: 'client' | 'provider' | 'both', noticeDays?: number, notes?: string }`
- `terms.signParams` (optional) — `[{ key, label, required? }]` — when set, sign UI renders guided fields that populate `metadata`.

## Drafts

`GET/POST/PATCH/DELETE /query/v1/users/:author/obl-drafts` (JWT). Publish via `offer_publish` broadcast, not via query-api.
