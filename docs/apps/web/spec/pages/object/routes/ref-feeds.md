---
id: web-pages-object-routes-ref-feeds
title: Object page — related, similar, add-on feeds
description: "Center-column full feeds for Related, Similar, and Add-On tabs. Right-rail previews: right-rail.md."
type: spec
status: active
scope: web
tags: [web, page, object, feeds]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/pages/object/page-shell.md
  - docs/apps/web/spec/pages/object/routes/right-rail.md
  - docs/apps/web/spec/object-card.md
---

# Object page — ref feeds (Related / Similar / Add-On)

**Back:** [page-shell](../page-shell.md) · **Related:** [right-rail](right-rail.md), [navigation.md](../navigation.md), [object-card.md](../../../object-card.md)

## Purpose

Center-column full feeds for Related, Similar, and Add-On tabs. Right-rail previews: [right-rail.md](right-rail.md).

## Routes

| Public URL | Registry gate | query-api |
|------------|---------------|-----------|
| `/object/:id/related` | `isRelatedTo` in object type `supported_updates` | `GET /query/v1/objects/:id/related` |
| `/object/:id/similar` | `isSimilarTo` | `GET .../similar` |
| `/object/:id/add-on` | `addOn` | `GET .../add-on` |

Proxy rewrites path to `?tab=` — [routing-proxy](../../../routing-proxy.md).

## UI

| Tab | Center component | Card |
|-----|------------------|------|
| related / similar / add-on | `ObjectRefListFeed` | [`ObjectCard`](../../../object-card.md) |

- Page size: `REF_LIST_PAGE_SIZE` (20)
- Load more: [`load-more-ref-list.actions.ts`](../../../../../apps/web/src/app/(app)/object/[object-id]/related/load-more-ref-list.actions.ts)
- Infinite scroll via `useInfiniteScroll` + `useSyncedPaginatedList`

## Behavior

- Tab hidden when object type does not support the update type or API returns empty on SSR.
- Right rail shows up to 5 items + “Show more” linking to the same tab URL.

## Verification

| Check | How |
|-------|-----|
| Tab URL | `/object/:id/related` — address bar keeps path segment |
| Empty type | Section omitted when unsupported |

## Related code paths

| Path | Role |
|------|------|
| `apps/web/src/modules/object/infrastructure/object-ref-list.client.ts` | Fetch + pagination |
| `apps/web/src/modules/object/presentation/components/object-ref-list-feed.tsx` | List UI |
