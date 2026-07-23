---
id: query-api-obl
title: OBL read API (query-api)
description: Drafts, offer search, ledger/balance, MCP tools.
type: spec
status: active
scope: query-api
tags: [obl, query-api]
updated_at: 2026-07-23
related:
  - docs/spec/open-business-layer.md
  - docs/apps/query-api/spec/overview.md
  - docs/spec/obl/mutual-ledger.md
  - docs/spec/obl/contracts.md
---

# OBL query-api

Domain: `apps/query-api/src/domain/obl/`

OpenAPI schemas: `apps/query-api/src/openapi/obl.openapi.ts`

## Data model (read path)

- **`obl_invoices`** — header only: `issuer`, `debtor`, `kind` (`single` | `multi`), optional `contract_id`, `details`.
- **`obl_obligation_lines`** — netting source: one row per beneficiary line (`debtor`, `beneficiary`, `amount_usd`, `state`, `role?`, `dispute_group`).
- List endpoints return **one row per obligation line** (joined with header). Field `creditor` is a backward-compatible alias for `beneficiary`.
- `GET /obl/invoices/:invoiceId` returns header fields plus full `lines[]` array.

Multi-line invoices in **list** views may aggregate amounts in arbitration/legacy helpers; use invoice detail for per-line breakdown.

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
| GET | `/query/v1/obl/ledger/payments\|invoices\|contracts\|disputes` | Cursor pages: `limit`, `cursor?` — invoices/disputes scoped via `obl_obligation_lines` pair |
| GET | `/query/v1/obl/balance?accountA=&accountB=` |
| GET | `/query/v1/obl/contracts/:contractId` |
| GET | `/query/v1/obl/invoices/:invoiceId` | Header + `lines[]`, `kind` |
| GET | `/query/v1/obl/disputes/:disputeId` |
| GET | `/query/v1/obl/convert/usd-to-waiv?amountUsd=` |

## MCP tools

`search_obl_offers`, `get_obl_offer`, `get_obl_ledger`, `get_obl_balance`, `get_obl_relationships`, `get_obl_arbitration`, `get_obl_contract`, `convert_usd_to_waiv`

## Verification

```bash
pnpm nx test query-api -- --testPathPatterns=obl
pnpm nx build query-api
```
