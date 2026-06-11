---
id: web-search
title: Header search and BFF
description: "Predictive search in the app header: debounced queries, dropdown results, discover deep-links. Browser calls Next.js BFF routes; BFF proxies query-api with locale and viewer headers."
type: spec
status: active
scope: web
tags: [web, search, app-header]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/overview.md
  - docs/apps/web/spec/app-header.md
  - docs/apps/web/spec/pages/discover/page.md
---

# Header search and BFF

**Back:** [web overview](overview.md) · **Related:** [app-header](app-header.md), [discover](pages/discover/page.md)

## Purpose

Predictive search in the app header: debounced queries, dropdown results, discover deep-links. Browser calls Next.js BFF routes; BFF proxies query-api with locale and viewer headers.

## UI

| Piece | Location |
|-------|----------|
| Search shell | `TopNav` in `@/modules/app-header` |
| Dropdown | `SearchDropdown` — object sections, user section, discover chips |
| Debounce | ~300ms on `searchBarValue`; fetches when trimmed query non-empty |

Discover chips link to `/discover` with `q`, `type`, or `users=1` (see [discover.md](pages/discover/page.md)).

## BFF routes

| BFF | Upstream | Role |
|-----|----------|------|
| `GET /api/search?q=&limit=&type=` | `GET /query/v1/search` | Combined object + user hits |
| `GET /api/search/counts?q=` | query-api search counts | Tab badge counts in dropdown |
| `POST /api/search/objects-by-ids` | query-api resolve by ids | Hydrate editor/object refs by id |

All routes: `dynamic = 'force-dynamic'`; pass `Accept-Language`, `X-Locale`, optional `X-Viewer` from session.

## Client module

`@/modules/app-header/infrastructure/search.client.ts`:

- `fetchSearchResults`, `fetchSearchCounts`, `fetchObjectsByIds`
- Zod schemas in `domain/search-response.schema.ts`
- `buildDiscoverHrefFromSearch` for chip URLs

Editor and object-create flows reuse the same client for object pickers.

## Verification

| Command | Purpose |
|---------|---------|
| `pnpm nx test web --testPathPattern=search.client` | Client fetch + schema |
| Manual | Type in header search; chips open `/discover` with correct query |

## Related code paths

| Path | Role |
|------|------|
| `apps/web/src/modules/app-header/presentation/components/top-nav.tsx` | Search UX |
| `apps/web/src/app/api/search/route.ts` | Search BFF |
