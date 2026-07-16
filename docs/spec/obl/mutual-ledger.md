---
id: obl-mutual-ledger
title: OBL Mutual Ledger
description: Per-pair eternal USD ledger, balance states, netting formula.
type: spec
status: active
scope: platform
tags: [obl, ledger, balance]
updated_at: 2026-07-16
related:
  - docs/spec/open-business-layer.md
  - docs/spec/obl/payments.md
---

# Mutual Ledger

Per account pair (A↔B), eternal. Starts at first `contract_sign` between the pair (`obl_ledgers` or earliest `obl_contracts`).

## Balance states (USD)

| State | Meaning |
|-------|---------|
| `confirmed` | Signed-ledger invoices (incl. resolved) minus **confirmed** payments (`payment_confirm`) |
| `pending` | Prerequisite invoices (`pending`), plus **pending** payments from `payment_declare` awaiting receiver confirm |
| `disputed` | Invoices in `disputed` state after `dispute_open` (payments do not contribute) |

Netting (positive net ⇒ B owes A):

```
owes(A→B) = Σ inv[debtor=A,creditor=B] − Σ pay[payer=A,receiver=B]
net = owes(B→A) − owes(A→B)
```

Resolved invoices use `final_amount_usd` in the confirmed bucket.

## Cutoff

Only events with `created_event_seq` **after** ledger start count. Pre-sign WAIV transfers and votes are ignored.

## Read API

`GET /query/v1/obl/balance?accountA=&accountB=` — balance only.  
`GET /query/v1/obl/ledger?accountA=&accountB=` — full drill-down.
