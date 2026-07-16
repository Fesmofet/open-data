---
id: obl-disputes
title: OBL disputes
description: dispute_open / dispute_resolve and balance impact.
type: spec
status: active
scope: platform
tags: [obl, disputes]
updated_at: 2026-07-16
related:
  - docs/spec/open-business-layer.md
  - docs/spec/obl/mutual-ledger.md
---

# Disputes

Frozen in contract: `dispute_rule` ∈ `client` | `provider` | `arbiter` (read from the disputed invoice's `contract_id` when present).

## Actions

- `dispute_open` — disputant ∈ {debtor, creditor}; invoice → `disputed`
- `dispute_resolve` — authorized resolver sets `final_amount_usd`; invoice → `resolved`

Client-generated `dispute_id` values use prefixed UUIDs (`dispute-{uuid}`).

## Resolution authority

| Rule | Who may resolve |
|------|-----------------|
| `client` | client account |
| `provider` | provider account |
| `arbiter` | frozen `arbiter` account |

Balance: open dispute amount in **disputed**; after resolve, `final_amount_usd` in **confirmed**.

## Web UI

On the relationship **Disputes** tab, open disputes show **Resolve dispute** when the signed-in account matches the resolver for the invoice's contract rule. `BusinessResolveDisputeModal` broadcasts `dispute_resolve` with editable final amount (default = proposed amount).

Resolved disputes show the full settlement chain: **original invoice amount → proposed amount → agreed final amount** and **resolver** account. The **Invoices** tab shows `$original → $final` for resolved invoices.

## Arbiter inbox (web)

When `dispute_rule` is `arbiter`, the assigned arbiter is not a ledger counterparty and does not appear on **Relationships**. The Business nav **Arbitration** tab (`/business/arbitration`) lists disputes on contracts where `contract.arbiter` equals the signed-in account.

| Filter | Query | Content |
|--------|-------|---------|
| Open (default) | `?status=open` | Cards with **Resolve dispute** → `BusinessResolveDisputeModal` |
| Resolved | `?status=resolved` | Same cards with final amount and resolver via `DisputeSettlementSummary` |

Data: `GET /query/v1/obl/arbitration?account=&status=&limit=&cursor=`. See [arbitration.md](../../../apps/web/spec/pages/business/arbitration.md).
