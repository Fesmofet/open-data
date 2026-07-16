---
id: web-business-arbitration
title: Business arbitration inbox
description: Arbiter dispute queue under /business/arbitration.
type: spec
status: active
scope: web
tags: [web, business, obl, disputes]
updated_at: 2026-07-16
related:
  - docs/apps/web/spec/pages/business/overview.md
  - docs/spec/obl/disputes.md
  - docs/apps/query-api/spec/obl.md
---

# Arbitration inbox

**Back:** [business overview](overview.md)

## Route

| Route | Role |
|-------|------|
| `/business/arbitration` | Open disputes assigned to viewer as `contract.arbiter` (default filter) |
| `/business/arbitration?status=resolved` | Resolved dispute history |

Nav item **Arbitration** is always visible in the Business shell (after Relationships).

## UX

- Filter pills: **Open** / **Resolved** (`arbitration-status-url.ts`, URL-synced).
- Infinite scroll via `useSyncedPaginatedList` + `loadMoreOblArbitrationAction`.
- Each card: `@provider ↔ @client`, offer name, `DisputeSettlementSummary`, optional **View relationship** → disputes tab.
- Open cards: **Resolve dispute** opens shared `BusinessResolveDisputeModal` (`dispute_resolve` broadcast).
- Empty copy: “No disputes assigned to you”.

## Data

- Initial page: `fetchOblArbitration` in RSC (`obl-arbitration.server.ts`).
- Cache tag: `queryApiCacheTags.oblArbitration(account, status)`.
- After arbiter resolve: `revalidateOblAfterBroadcast` with `refreshArbitration` and `ledgerPairs` for provider/client.

## Files

| Piece | Path |
|-------|------|
| Page | `apps/web/src/app/(app)/business/arbitration/page.tsx` |
| Loading | `apps/web/src/app/(app)/business/arbitration/loading.tsx` |
| Client | `business-arbitration-client.tsx` |
| Skeleton | `skeletons/business-arbitration-skeleton.tsx` |
