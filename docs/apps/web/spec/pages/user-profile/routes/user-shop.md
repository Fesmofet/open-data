---
id: web-pages-user-profile-routes-user-shop
title: User profile shop and recipe
description: Department-style object catalogs for a user’s shop (`book`, `product`) and recipe (`recipe`) lists with category navigation in the left parallel route.
type: spec
status: active
scope: web
tags: [web, page, user-profile, shop]
updated_at: 2026-06-17
related:
  - docs/apps/web/spec/overview.md
  - docs/apps/web/spec/pages/user-profile/profile-shell.md
  - docs/apps/web/spec/object-card.md
---

# User profile — shop and recipe

**Back:** [profile shell](../profile-shell.md) · [web overview](../../../overview.md) · **Related:** [object-card.md](../../../object-card.md)

## Purpose

Department-style object catalogs for a user’s shop (`book`, `product`) and recipe (`recipe`) lists with category navigation in the left parallel route.

## Routes

| Public URL | Main content | Left `@leftSidebar` |
|------------|--------------|---------------------|
| `/@:name/user-shop` | `(main)/user-shop/page.tsx` | `@leftSidebar/user-shop/page.tsx` |
| `/@:name/user-shop/:category/...` | `(main)/user-shop/[...categoryPath]/page.tsx` | `@leftSidebar/user-shop/[...categoryPath]/page.tsx` |
| `/@:name/recipe` | `(main)/recipe/page.tsx` | `@leftSidebar/recipe/page.tsx` |
| `/@:name/recipe/:category/...` | `(main)/recipe/[...categoryPath]/page.tsx` | `@leftSidebar/recipe/[...categoryPath]/page.tsx` |

## Module layout

| Component | Role |
|-----------|------|
| `ProfileShopMainContent` | Center column object grid (`types`: shop → `['book','product']`, recipe → `['recipe']`) |
| `CategoryNav` | Left rail category tree for current `basePath` and `lineageSegments` |
| `ProfileShopFilters` | Right rail tag + rating filters (shop and recipe tabs) |
| `ProfileShopFilterChips` | Active filter pills above the feed |
| `ObjectCard` | Card rendering — [object-card.md](../../../object-card.md) |
| `shop-feed.actions.ts` | Server actions for paginated shop loads |

## Behavior

- **basePath:** `/@${accountName}/user-shop` or `/recipe` — used for nav links and breadcrumbs.
- **Parallel routes:** `(main)/layout.tsx` renders `@leftSidebar` slot; shop/recipe pages pair main + sidebar segments.
- **Filters:** URL query `tags=Category:value` (repeatable, AND) and optional `rating` (`6` | `8` | `10`). Right column loads facets from BFF `GET /api/users/:name/shop/filters` (scoped to current category path). Same filters on `user-shop` and `recipe`. When any filter is active, the center column uses a **flat** `shop-objects` list (not category sections) so facet counts match visible rows.
- **Filter preservation:** Left category nav links, section header links, Up/All, and Uncategorized preserve active `tags`/`rating` query params via `buildProfileShopHref`.
- **Pagination:** load-more buttons on object lists and section pages; maps API rows via `ObjectCard`.
- **Shell mode:** left category rail hidden on Instagram/Twitter presets per `shell-hide-instagram` / vertical rail swap (see [profile-shell.md](../profile-shell.md)).

## Verification

| Command | Purpose |
|---------|---------|
| `pnpm nx run web:typecheck` | Parallel route typing |
| Manual | Navigate shop categories; URL stays `/@:name/user-shop/...` |

## Related code paths

| Path | Role |
|------|------|
| `apps/web/src/app/(app)/user-profile/[name]/(profile)/(main)/user-shop/page.tsx` | Shop landing |
| `apps/web/src/modules/user-profile/presentation/components/profile-shop-main-content.tsx` | Main grid |
