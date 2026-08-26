---
id: web-pages-object-data-loading
title: Object page — data loading
description: Server-side fetch and caching for `/object/[object-id]`. Used by `page.tsx`, `generateMetadata`, and embedded sections.
type: spec
status: active
scope: web
tags: [web, page, object, data-loading]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/pages/object/page-shell.md
  - docs/apps/web/spec/seo.md
---

# Object page — data loading

**Back:** [page-shell](page-shell.md) · [web overview](../../overview.md)

## Purpose

Server-side fetch and caching for `/object/[object-id]`. Used by `page.tsx`, `generateMetadata`, and embedded sections.

## Primary model

| Loader | File | Upstream |
|--------|------|----------|
| `loadObjectPageModel` | [`object-page-model.server.ts`](../../../../../apps/web/src/app/(app)/object/[object-id]/object-page-model.server.ts) | `fetchProjectedObjectWithCounts` + `fetchObjectOptions` → query-api |

Wrapped in **`react.cache()`** — shared by metadata and page body.

`fetchObjectOptions` loads aggregated variant options (`GET /query/v1/objects/:id/options`) in parallel with resolve. Results map to the left-rail `options` block (Color/Size selectors) when non-empty; edit mode shows the `+` slot when the object type supports `option`.

### Resolve options

- **`locale`** — `getRequestLocale()` → `X-Locale` on query-api
- **`viewer`** — cookie auth username or `null` → `X-Viewer`
- **`includeSeo: true`** for metadata path — see [seo.md](../../seo.md)

### Query API visibility

Object page resolve (`POST /query/v1/objects/resolve`) loads **any** `objects_core.status`. Search, discover, favorites, and nested/ref cards of other objects still restrict to `status = 'active'`. Non-active objects show a lifecycle badge in the hero when `status !== 'active'`. For **`closed`** venue types (`business`, `restaurant`, `place`, `shop`), the hero label and left-rail notice (“Permanently closed”, body copy, “Suggest a correction”) link to `/object/:id/updates?update_type=status`.

## Fallback

- Demo objects: `DEMO_OBJECT_IDS` → `mockModelFromDemoPreset` when API returns null
- Missing object → `notFound()` in `page.tsx`

## Additional SSR payloads (same request)

Loaded in `page.tsx` when tabs/sections need them:

| Data | When | Source |
|------|------|--------|
| Right rail ref previews | Always (view mode rail) | `fetchObjectRefList` related/similar/add-on |
| Followers preview | `followers_count > 0` | `getObjectFollowersPageQuery` (limit 6) |
| Updates feed initial page | Active tab `updates` | `ObjectPageUpdatesFeedSection` |
| Ownership lists | Tab `ownership` | `getObjectOwnershipPageQuery` |
| Ref list full page | Tab related/similar/add-on | `fetchObjectRefList` page size 20 |
| Related album preview | Active tab `gallery` (SSR) or client on gallery tab | `fetchObjectRelatedAlbumPreview` |
| Related album list page | `gallery_album=Related` (SSR) or client in `ObjectRelatedAlbumSection` | `fetchObjectRelatedAlbumPage` |
| Nested stack | `?path=` | `resolveNestedObjectPath` / per-item resolve |

## Mapping

`projectedObjectWithCountsToPageModel` in `@/modules/object/infrastructure/projected-object-to-page-model.ts` → `ObjectPageViewModel` (tabs, default landing, left rail blocks, embedded updates feed options).

## Verification

| Command | Purpose |
|---------|---------|
| `pnpm nx test web --testPathPatterns=projected-object-to-page-model` | Loader / page-model mapping |
| `pnpm nx test web --testPathPatterns=object-options-section` | Options UI helpers |
| Manual | View source — title from `model.seo`; hero counts match resolve |

## Related code paths

| Path | Role |
|------|------|
| `apps/web/src/modules/object/infrastructure/fetch-object-resolve.server.ts` | HTTP resolve |
| `apps/web/src/modules/object/infrastructure/fetch-object-options.server.ts` | HTTP variant options |
| `apps/web/src/modules/object/presentation/components/object-options-section.tsx` | Color/Size selector UI |
| `apps/web/src/seo/application/build-object-metadata.ts` | Metadata from `model.seo` |
