---
id: obl-mutual-ledger
title: OBL Mutual Ledger
description: Per-pair eternal USD ledger, balance states, netting formula.
type: spec
status: active
scope: platform
tags: [obl, ledger, balance]
updated_at: 2026-07-14
related:
  - docs/spec/open-business-layer.md
  - docs/spec/obl/payments.md
---

# Mutual Ledger

Per account pair (A↔B), eternal. Starts at first `contract_sign` between the pair (`obl_ledgers` or earliest `obl_contracts`).

## Balance states (USD)

| State | Meaning |
|-------|---------|
| `confirmed` | Signed-ledger invoices (incl. resolved) minus confirmed payments |
| `pending` | Prerequisite invoices, off-chain declare/confirm not fully settled |
| `disputed` | Open dispute on invoice amount |

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
