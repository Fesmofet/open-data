---
id: obl-contracts
title: OBL contracts lifecycle
description: Offers, contracts, invoices — on-chain actions and tables.
type: spec
status: active
scope: platform
tags: [obl, contracts]
updated_at: 2026-07-23
related:
  - docs/spec/open-business-layer.md
---

# Contracts lifecycle

## Tables

- `obl_offers` — versioned templates (`PK offer_id, version`); `created_at`
- `obl_contracts` — signed instances (1 offer : many contracts); `created_at`, `metadata` JSONB
- `obl_invoices` — invoice header (`issuer`, `debtor`, `kind`, optional `contract_id`, `details`); `created_at`
- `obl_obligation_lines` — netting source: `(debtor, beneficiary, amount_usd, state, invoice_id, dispute_group, role?)`; pair = `LEAST/GREATEST(debtor, beneficiary)`
- `obl_offer_drafts` — off-chain drafts (query-api only)

## Actions (`obl-mainnet` / `obl-testnet`)

| Action | Signer | Effect |
|--------|--------|--------|
| `offer_publish` | `author` | New offer version |
| `offer_update` | `author` | Append version |
| `offer_retire` | `author` | Mark retired |
| `contract_sign` | counterparty (`signer`) | Create contract; may start ledger. **One contract per `offer_id` + account pair** (deterministic `contract_id`, unique index). Optional `metadata` JSONB. |
| `invoice_issue` | `issuer` | Header + obligation line(s). **Legacy:** `creditor` + `amount_usd` (single line). **Multi:** `beneficiaries[]` with `{ beneficiary, amount_usd, role? }` (2+ lines → `kind=multi`). Attestor invoices (issuer not debtor/beneficiary) require `contract_id` (governing contract with issuer + debtor). Auto-starts ledger per debt pair when authorized by governing contract. |

Invoice line before pair ledger: line `state=pending` until a ledger exists for **that line's** `(debtor, beneficiary)` pair. Promotion to `confirmed` happens when:

1. **Attestor invoice** — auto-starts the debt-pair ledger at issue time (lines become `confirmed` immediately).
2. **Classic single** — `contract_sign` on the contract pair `(provider, client)` starts the ledger and promotes pending lines on the **same** pair (when `debtor`/`creditor` align with contract parties).
3. **Multi-beneficiary** — each line's pair is `(debtor, beneficiary_i)`; `contract_sign` on the governing contract pair does **not** promote lines on other pairs. Those lines need an existing ledger on their debt pair (e.g. attestor auto-start) or stay `pending`.

Dispute resolution authority is read from the invoice header's `contract_id` (governing contract: `dispute_rule`, `arbiter`).

## `contract_sign` payload

- `contract_id` — web uses deterministic id: `contract-{offer_id}-{pair_low}-{pair_high}` (sorted accounts).
- `metadata` (optional) — initialization context (monitoring targets, governance object, etc.). Stored in `obl_contracts.metadata`.

## Offer `terms` extensions (on-chain in `terms` JSONB)

- `terms.termination` — `{ mode: 'instant' | 'notice', who: 'client' | 'provider' | 'both', noticeDays?: number, notes?: string }`
- `terms.signParams` (optional) — `[{ key, label, required? }]` — when set, sign UI renders guided fields that populate `metadata`.

## Drafts

`GET/POST/PATCH/DELETE /query/v1/users/:author/obl-drafts` (JWT). Publish via `offer_publish` broadcast, not via query-api.
