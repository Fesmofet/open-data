---
id: query-api-obl
title: OBL read API (query-api)
description: Drafts, offer search, ledger/balance, MCP tools.
type: spec
status: active
scope: query-api
tags: [obl, query-api]
updated_at: 2026-07-14
related:
  - docs/spec/open-business-layer.md
  - docs/apps/query-api/spec/overview.md
---

# OBL query-api

Domain: `apps/query-api/src/domain/obl/`

## Drafts (auth)

| Method | Path |
|--------|------|
| GET | `/query/v1/users/:author/obl-drafts` |
| GET | `/query/v1/users/:author/obl-drafts/one?draftId=` |
| POST | `/query/v1/users/:author/obl-drafts` |
| PATCH/PUT | `/query/v1/users/:author/obl-drafts?draftId=` |
| DELETE | `/query/v1/users/:author/obl-drafts?draftId=` |

## Read (public)

| Method | Path |
|--------|------|
| GET | `/query/v1/obl/offers/search` | `status` optional: `active` (default), `retired`, `all` — owner dashboards use `author` + `status=all` |
| GET | `/query/v1/obl/offers/:offerId` |
| GET | `/query/v1/obl/ledger?accountA=&accountB=` |
| GET | `/query/v1/obl/balance?accountA=&accountB=` |
| GET | `/query/v1/obl/convert/usd-to-waiv?amountUsd=` |

## MCP tools

`search_obl_offers`, `get_obl_ledger`, `get_obl_balance`, `convert_usd_to_waiv`

## Verification

```bash
pnpm nx test query-api -- --testPathPatterns=compute-pair-balance
pnpm nx build query-api
```
