---
id: obl-disputes
title: OBL disputes
description: dispute_open / dispute_resolve and balance impact.
type: spec
status: active
scope: platform
tags: [obl, disputes]
updated_at: 2026-07-14
related:
  - docs/spec/open-business-layer.md
  - docs/spec/obl/mutual-ledger.md
---

# Disputes

Frozen in contract: `dispute_rule` ∈ `client` | `provider` | `arbiter`.

## Actions

- `dispute_open` — disputant ∈ {debtor, creditor}; invoice → `disputed`
- `dispute_resolve` — authorized resolver sets `final_amount_usd`; invoice → `resolved`

## Resolution authority

| Rule | Who may resolve |
|------|-----------------|
| `client` | client account |
| `provider` | provider account |
| `arbiter` | frozen `arbiter` account |

Balance: open dispute amount in **disputed**; after resolve, `final_amount_usd` in **confirmed**.
