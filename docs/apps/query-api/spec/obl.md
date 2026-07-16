---
id: query-api-obl
title: OBL read API (query-api)
description: Drafts, offer search, ledger/balance, MCP tools.
type: spec
status: active
scope: query-api
tags: [obl, query-api]
updated_at: 2026-07-16
related:
  - docs/spec/open-business-layer.md
  - docs/apps/query-api/spec/overview.md
---

# OBL query-api

Domain: `apps/query-api/src/domain/obl/`

## Drafts (auth)

| Method | Path |
|--------|------|
| GET | `/query/v1/users/:author/obl-drafts` | `limit` (default 20, max 50), `offset` → `{ items, hasMore }` |
| GET | `/query/v1/users/:author/obl-drafts/one?draftId=` |
| POST | `/query/v1/users/:author/obl-drafts` |
| PATCH/PUT | `/query/v1/users/:author/obl-drafts?draftId=` |
| DELETE | `/query/v1/users/:author/obl-drafts?draftId=` |

## Read (public)

| Method | Path |
|--------|------|
| GET | `/query/v1/obl/offers/search` | `limit`/`offset` → `{ items, hasMore }`; `status` optional: `active` (default), `retired`, `all` |
| GET | `/query/v1/obl/offers/:offerId` |
| GET | `/query/v1/obl/relationships?account=` | `limit`/`offset` → `{ items, hasMore }`; batch balance (no N× full ledger) |
| GET | `/query/v1/obl/arbitration?account=` | `status` `open` \| `resolved` (default `open`); cursor page of dispute + invoice + contract + offer name |
| GET | `/query/v1/obl/ledger?accountA=&accountB=` | Full ledger (legacy); contracts respect `started_event_seq` cutoff |
| GET | `/query/v1/obl/ledger/payments|invoices|contracts|disputes` | Cursor pages: `limit`, `cursor?` |
| GET | `/query/v1/obl/balance?accountA=&accountB=` |
| GET | `/query/v1/obl/contracts/:contractId` |
| GET | `/query/v1/obl/convert/usd-to-waiv?amountUsd=` |

## MCP tools

`search_obl_offers`, `get_obl_offer`, `get_obl_ledger`, `get_obl_balance`, `get_obl_relationships`, `get_obl_arbitration`, `get_obl_contract`, `convert_usd_to_waiv`

## Verification

```bash
pnpm nx test query-api -- --testPathPatterns=compute-pair-balance
pnpm nx build query-api
```
