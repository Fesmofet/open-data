---
id: obl-relationships-api
title: OBL relationships list API
description: Paginated counterparties with per-pair balance summary.
type: spec
status: active
scope: cross-cutting
tags: [obl, query-api]
updated_at: 2026-07-16
related:
  - docs/apps/query-api/spec/obl.md
  - docs/spec/obl/mutual-ledger.md
---

# OBL relationships list API

`GET /query/v1/obl/relationships`

## Query

| Param | Default | Max |
|-------|---------|-----|
| `account` | required | — |
| `limit` | 20 | 50 |
| `offset` | 0 | — |

## Response

```json
{
  "items": [
    {
      "counterparty": "bob",
      "roles": ["provider"],
      "contractCount": 2,
      "balance": { "accountA": "...", "confirmed": {}, "pending": {}, "disputed": {} },
      "lastActivityEventSeq": "12345",
      "lastActivityAt": "12345"
    }
  ],
  "hasMore": false
}
```

`lastActivityAt` is retained for compatibility; prefer `lastActivityEventSeq` (chain event sequence, not a timestamp).

## Counterparty discovery

A counterparty is any account that shares an OBL relationship edge with `account`:

- `obl_contracts` — provider/client pair
- `obl_obligation_lines` — debtor/beneficiary pair (split invoices, third-party beneficiaries)
- `obl_payments` — payer/receiver pair

Pairs that exist only via obligation lines or payments (no contract) appear in the list with `contractCount: 0` and empty `roles`. Balance still uses per-pair invoice lines and payments after the ledger cutoff (no ledger → no cutoff).

`lastActivityEventSeq` is the max `created_event_seq` across contracts, obligation lines, and payments for that pair.

## Balance semantics

Per-row `balance` uses invoices and payments for the pair after the ledger `started_event_seq` cutoff (same rules as [`mutual-ledger.md`](mutual-ledger.md)). Computed in one batch query per page — no per-counterparty full ledger fetch.

## Indexes

Migration `00041_obl_list_indexes` adds pair + `created_event_seq` indexes for list endpoints.
