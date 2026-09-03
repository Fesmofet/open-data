---
id: web-pages-discover
title: Discover page
description: Browse objects by type or users with optional text search and tag-category filters (AND semantics).
tags: [web, page, discover]
related:
  - docs/apps/web/spec/pages/index.md
type: spec
status: active
scope: web
updated_at: 2026-09-01
---

# Discover page (`/discover`)

Browse objects by type or users with optional text search and tag-category filters (AND semantics).

Hub chrome: under `(app)/(hub)` with FEED / DISCOVER / MARKET section nav (`AppSectionNav`). DISCOVER is active on this route. See [home](../home/page.md).

## Routes

| URL | Mode |
|-----|------|
| `/discover` (no `type`, no `users`) | Unselected — mobile opens type picker; desktop shows prompt in feed column |
| `/discover?type={object_type}` | Object feed for one registry type |
| `/discover?type=all` | Mixed object-type feed (no `object_type` sent to query-api) |
| `/discover?users=1` | User list (optional `q` prefix search) |
| `q`, `tags`, `sort`, `box`, `map` | Shared query params |

There is **no implicit default** object type (previously `product`). Bare `/discover` means nothing selected until the user picks a type or has a remembered type cookie.

### Map area (`box`)

Geo-capable registry types (`restaurant`, `place`, `business`, `person`, `service`) show a map on desktop (right rail above filters) and a **Map** entry on mobile (fullscreen modal). The URL param is:

`box=swLng,swLat,neLng,neLat` (WGS84; same order as query-api `ST_MakeEnvelope`).

- Applying **Search area** replace-navigates with `box` set; other params (`type`, `q`, `tags`, `sort`) are preserved.
- A removable **Map area** chip clears `box` without opening the map.
- No map on `type=all`, users mode, or non-geo types.
- Object feed and tag-category facets both respect `box` when present.

### Map camera (`map`)

`map=lat,lng,zoom` stores the **map camera only** (WGS84 latitude/longitude plus integer zoom `0–19`). It is **not** sent to query-api — only `box` filters results.

- Written to the URL when opening the fullscreen map or applying **Search area** (replace navigation, `scroll: false`).
- Not updated on every pan/zoom (avoids feed skeleton flicker during navigation).
- Preserved alongside `box`, `tags`, and `sort` when those params change.
- Initial map view order: URL `map` → fit applied `box` → default world view.

### Remembered object type

Cookie `discover_object_type` stores the last picked registry object type (client write on type selection; server read on page load). Returning visitors with a valid cookie are replace-navigated to `/discover?type={remembered}`. The cookie is never set for `users` mode or `type=all`.

## Mobile layout (< `lg`)

- **Type button** — accent label (`text-section`) in feed header; opens bottom sheet (`ModalShell variant="sheet"`) with searchable object-type list + All users. No duplicate "Discover" label on mobile.
- **Filters** — `+ Filter` opens filter bottom sheet (tag categories only; same data as desktop right column). Active chips shown inline; toggles apply immediately via URL replace. No "Filters" section heading.
- **List / Map** — geo types show underline sub-nav (`List` | `Map`) below filters. **List** shows the object feed + `Sort: …` dropdown. **Map** shows inline map (`DiscoverMapPanel variant="feed"`) with Search area, zoom, locate, and expand-to-fullscreen. Expanding opens the fullscreen map modal; **Search area** writes `box` to the URL.
- Desktop three-column layout (sidebar / feed / filters) unchanged at `lg+`; sidebar and desktop filter column hidden on mobile. Map rail stacks above the filters column when the type supports geo.

## API (via BFF)

| BFF | query-api |
|-----|-----------|
| `GET /api/discover/objects` | `GET /query/v1/discover/objects` |
| `GET /api/discover/users` | `GET /query/v1/discover/users` |
| `GET /api/discover/tag-categories` | `GET /query/v1/discover/tag-categories` |

### Object feed

- Filters: `object_type`, optional FTS `q`, `tags[]` (each tag = `category:value` encoding, e.g. `Cuisine:asian`; AND across all selected tags; both `value_json.category` and `value_json.value` must match), optional `box` (map bounding box: `swLng,swLat,neLng,neLat`).
- Sort: `rank` (default, `objects_core.weight DESC`), `newest` (`created_at DESC`), `oldest`.
- Cursor: opaque base64 JSON (`created_at`, `weight`, `object_id`, `sort`).
- Cards: projected with shop card update types (`name`, `image`, `description`, `tagCategoryItem`, `aggregateRating`) plus `geo` for map markers.

### User feed (`?users=1`)

- Cursor: opaque base64 JSON (`wobjects_weight`, `name`).
- Sort: `wobjects_weight DESC NULLS LAST`, `name ASC`.
- Row UI (`DiscoverUserFeed`): avatar, username, expertise chip (`wobjects_weight`, 2 decimals) + `·` + plain `followers_count`; `StatHoverTooltip` on expertise and followers (same i18n keys as header search). Optional `search_user_following` label when `is_following`.

### Tag categories sidebar

- Aggregated from `object_updates` where `update_type = tagCategoryItem`, grouped by `value_json.category` / `value_json.value`.
- Optional `q` and `box` narrow facet counts (same geographic predicate as the object feed when `box` is set).
- Redis cache: `query-api:cache:tag-categories:{objectType}` (TTL 300s). Skipped when `q`, active `tags`, or `box` is present.
- Section order follows `supposed_updates` TAG_CATEGORY values in `@opden-data-layer/core` object-type registry.

### Indexes

Migration `00013_discover_indexes`: expression index on tag item `(value, category)`; `(object_type, seq DESC)` on active `objects_core`.

## Search integration

Header search dropdown chips (per `object_type` and Users) link to `/discover` with `q` and `type` / `users=1`. The **All** chip links to `/discover?type=all&q=…`.

**Enter key** (when no highlighted result): navigate to discover with selected type (URL or remembered cookie), exact username profile match, or mixed results (`type=all`).

## Object page tags

On `/object/:object_id`, tag chips in the left rail **Tags** block link to `/discover?type={object_type}&tags={category}:{value}` (e.g. `Cuisine:asian`) where `object_type` is `ObjectPageViewModel.objectTypeKey` (registry key from query-api, e.g. `recipe`). Legacy value-only `tags` in the URL are ignored by query-api.

## Verification

```bash
pnpm nx test query-api --testPathPattern=discover
pnpm nx test web --testPathPattern=discover
pnpm check:web-i18n-utf8
pnpm exec playwright test src/discover-map.spec.ts
```
