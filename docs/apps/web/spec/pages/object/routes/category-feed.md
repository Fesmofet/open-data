---
id: web-pages-object-routes-category-feed
title: Object page — category objects feed
description: "Center-column feed of global objects sharing a department category name, opened from the left rail."
type: spec
status: active
scope: web
tags: [web, page, object, feeds, categories]
updated_at: 2026-07-10
related:
  - docs/apps/web/spec/pages/object/page-shell.md
  - docs/apps/web/spec/pages/object/routes/ref-feeds.md
  - docs/apps/query-api/spec/category-objects.md
---

# Object page — category feed

**Back:** [page-shell](../page-shell.md) · **Related:** [ref-feeds](ref-feeds.md), [query-api category-objects](../../../../query-api/spec/category-objects.md)

## Purpose

When the user clicks a department category in the left rail, the center column shows a paginated feed of other objects that contain that category name, sorted by weight.

## Route

| Public URL | query-api |
|------------|-----------|
| `/object/:id/category/:encodedName` | `GET /query/v1/categories/objects?name=…&exclude_object_id=:id` |

Proxy rewrites to `?tab=category&category_name=:encodedName` — same pattern as gallery album paths.

Example: `Clothing, Shoes & Jewelry` → `/object/:id/category/Clothing,%20Shoes%20%26%20Jewelry`.

## Left rail

- Block: `category` (`UPDATE_TYPES.CATEGORY`) on types that support it (`book`, `product`, `service`, `recipe`).
- View: vertical list under heading `Categories:`; first **2** names visible, text **Show all categories** / **Show less** (no button chrome).
- Edit: values + standard `LeftRailEditToolbar` / `AddUpdateModal` (plain multi text).

## Center column

| Component | Card |
|-----------|------|
| `ObjectCategoryObjectsFeed` | [`ObjectCard`](../../../object-card.md) |

- Page size: `REF_LIST_PAGE_SIZE` (20)
- Load more: [`load-more-category-objects.actions.ts`](../../../../../apps/web/src/app/(app)/object/[object-id]/category/load-more-category-objects.actions.ts)
- Infinite scroll via `useInfiniteScroll` + `useSyncedPaginatedList`

## Verification

| Check | How |
|-------|-----|
| Category URL | Click left-rail category — address bar shows `/object/:id/category/…` |
| Feed | Center column lists `ObjectCard` rows; scroll loads more |
| Empty | `emptyCategory` message when no matches |

## Related code paths

| Path | Role |
|------|------|
| `apps/web/src/modules/object/presentation/components/object-category-left-rail-section.tsx` | Left rail list + show more |
| `apps/web/src/modules/object/infrastructure/category-objects.client.ts` | Fetch + pagination |
| `apps/web/src/modules/object/presentation/components/object-category-objects-feed.tsx` | Center feed UI |
