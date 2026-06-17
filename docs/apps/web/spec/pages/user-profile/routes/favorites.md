---
id: web-pages-user-profile-routes-favorites
title: User profile — favorites
description: "Favorite objects for a user at `/@:name/favorites` with optional type filter segment."
type: spec
status: active
scope: web
tags: [web, page, user-profile, favorites]
updated_at: 2026-06-17
related:
  - docs/apps/web/spec/pages/user-profile/profile-shell.md
  - docs/apps/query-api/spec/users-favorites-endpoint.md
---

# User profile — favorites

**Back:** [profile shell](../profile-shell.md)

## Purpose

Favorite objects for a user at `/@:name/favorites` with optional type filter segment in the URL.

## Routes

| Public URL | App Router file |
|------------|-----------------|
| `/@:name/favorites` | `(main)/favorites/page.tsx` |
| `/@:name/favorites/:objectType` | `(main)/favorites/[objectType]/page.tsx` |

Left sidebar (parallel `@leftSidebar/favorites/*`): type list from `GET .../favorites/types`.

## URL behavior

| URL | Sidebar active | Feed filter |
|-----|----------------|-------------|
| `/@name/favorites` | First type (no type in URL) | First type from API |
| `/@name/favorites/restaurant` | `restaurant` | `restaurant` |

Nav links always use typed URLs (`.../favorites/{type}`). On bare URL, the first type is `aria-current="page"` until the user clicks it (then the segment appears in the path).

Unknown `objectType` → `notFound()`.

## Components

- `FavoritesTypeNav` — left column type list (`'use client'`; i18n for empty types)
- `FavoritesObjectList` — `ObjectCard` feed with infinite scroll (`loadMore` server action)
- `ProfileFavoritesMainContent` — server wrapper; remounts list via `key={effectiveType}` on type change
- `FavoritesEmptyMain` — shown when `types.length === 0` (uses `empty_favorites`, not per-type `favorites_empty`)

## Data loading

- Sidebar and main both call `getFavoritesTypesQuery` (wrapped in `react.cache()` — one fetch per request).
- Feed: `getFavoritesObjectsQuery` with `objectType` from URL or first type when bare `/favorites`.

## Cache invalidation

After toggling administrative heart (`AdministrativeHeartButton`), server revalidates both object tags and `userFavorites` / `userFavoritesTypes` for the viewer so the favorites feed and sidebar update on `router.refresh()`.

## `hide_favorite_objects`

When the profile owner has `user_metadata.hide_favorite_objects = true`, post-linked favorites are excluded from API scope (administrative authority favorites still appear). Chain indexer accepts `hide_favorite_objects` on `update_user_metadata` (defaults to `false` when omitted).

## Verification

Manual: open `/@:name/favorites`, confirm sidebar types, feed, and URL updates on type click.
