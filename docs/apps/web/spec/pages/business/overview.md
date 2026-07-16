---
id: web-business-overview
title: Business (OBL) UI
description: Private `/business` area and public offer/request discovery for Open Business Layer.
type: spec
status: active
scope: web
tags: [web, business, obl]
updated_at: 2026-07-14
related:
  - docs/apps/web/spec/overview.md
  - docs/spec/open-business-layer.md
  - docs/apps/query-api/spec/obl.md
  - docs/apps/web/spec/theme.md
---

# Business (OBL) UI

**Back:** [web overview](../overview.md) · **Platform:** [Open Business Layer](../../../../spec/open-business-layer.md) · **API:** [query-api OBL](../../../query-api/spec/obl.md)

## Purpose

Authenticated **Business** workspace for OBL: offer drafts, publish/retire, mutual-ledger relationships, invoices, payments, and disputes. Public `/offers` and `/requests` routes support discovery and contract signing.

Implementation module: `apps/web/src/modules/business/`.

## Theme tokens (mandatory)

All Business UI styling uses semantic tokens from [`apps/web/src/styles/theme.css`](../../../../../../apps/web/src/styles/theme.css). The file header documents mandatory rules (no raw hex, no default Tailwind scale). See [theme.md](../theme.md) and [apps/web/AGENTS.md](../../../../../../apps/web/AGENTS.md).

PR review: reject `#…`, `rgb(`, `text-sm`/`text-lg`, `rounded-md`, or inline colors unless listed as an AGENTS.md exception.

## Auth

| Area | Gate |
|------|------|
| `/business/**` | `requireBusinessUser()` → redirect `/sign-in` |
| `/offers`, `/requests` (list) | Public |
| `/offers/.../versions/:v`, `/requests/.../versions/:v` | Public read; sign requires wallet session |

Header entry: avatar menu → **Business** (`/business`) and **Browse offers** (`/offers`) (`logged-in-header-actions.tsx`).

## Route map

| Route | Phase | Role |
|-------|-------|------|
| `/business` | D | Overview shell (summary + activity placeholders) |
| `/business/offers` | A | Drafts / published / retired tabs |
| `/business/offers/new` | A | Create draft → redirect to editor |
| `/business/offers/drafts/:draftId` | A | 8-step editor, autosave, publish |
| `/business/offers/:offerId` | A | Owner detail, retire, new version |
| `/business/offers/:offerId/versions/:version` | A | Version read / sign (private viewer) |
| `/business/relationships` | B | Counterparty list |
| `/business/relationships/:account` | B | Balance cards + tabs (invoices, payments, disputes per counterparty) |
| `/business/contracts/:contractId` | B | Contract drill-down |
| `/offers`, `/requests` | A | Public search lists (`?author=`, `?q=`) |
| `/offers/:id/versions/:v`, `/requests/:id/versions/:v` | A | Public sign + disclosures |

Path builders: `modules/business/domain/routes.ts`.

## Data paths

| Concern | Path |
|---------|------|
| Draft CRUD | Server Actions → `GET/PATCH /query/v1/users/:author/obl-drafts` |
| Offers read | `obl-offers.server.ts` → query-api |
| Ledger / relationships | `obl-ledger.server.ts` |
| Broadcast | `useOblBroadcast` + `useOblCustomJsonId` + `@opden-data-layer/hive-broadcast` |
| USD→WAIV (client) | BFF `GET /api/business/convert-usd-to-waiv` |

## Phased delivery

| Phase | Scope |
|-------|--------|
| A | Drafts, editor, publish, lists, public sign |
| B | Relationships, contracts, per-relationship invoices/payments/disputes |
| C | Payments, converter (on relationship detail) |
| D | Disputes, overview polish, a11y |

Child specs: [offers.md](offers.md), [relationships.md](relationships.md), [blockchain-actions.md](blockchain-actions.md).

## Verification

```bash
pnpm nx run web:typecheck
pnpm check:web-i18n-utf8
pnpm nx test web -- --testPathPatterns=business
pnpm nx run web:verify-production-build
```
