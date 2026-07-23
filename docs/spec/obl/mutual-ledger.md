---
id: obl-mutual-ledger
title: OBL Mutual Ledger
description: Per-pair eternal USD ledger, balance states, netting formula.
type: spec
status: active
scope: platform
tags: [obl, ledger, balance]
updated_at: 2026-07-23
related:
  - docs/spec/open-business-layer.md
  - docs/spec/obl/payments.md
---

# Mutual Ledger

Per account pair (A↔B), eternal. Starts at first `contract_sign` between the pair (`obl_ledgers` or earliest `obl_contracts`), or when an attestor invoice auto-starts the debt pair ledger.

**Netting source:** `obl_obligation_lines` (not invoice headers). Each line has `debtor`, `beneficiary`, `amount_usd`, `state`. API list views map `beneficiary` → `creditor` for backward compatibility.

## Balance states (USD)

| State | Meaning |
|-------|---------|
| `confirmed` | Signed-ledger obligation lines (incl. resolved) minus **confirmed** payments (`payment_confirm`) |
| `pending` | Lines in `pending`, plus **pending** payments from `payment_declare` awaiting receiver confirm |
| `disputed` | Lines in `disputed` after `dispute_open` (payments do not contribute) |

Netting (positive net ⇒ B owes A):

```
owes(A→B) = Σ line[debtor=A,beneficiary=B] − Σ pay[payer=A,receiver=B]
net = owes(B→A) − owes(A→B)
```

Resolved lines use `final_amount_usd` in the confirmed bucket.

## Cutoff

Only events with `created_event_seq` **after** ledger start count. Pre-sign WAIV transfers and votes are ignored.

## Read API

`GET /query/v1/obl/balance?accountA=&accountB=` — balance only.  
`GET /query/v1/obl/ledger?accountA=&accountB=` — full drill-down.
