---
id: web-pages-home
title: Home page
description: App root landing under the hub shell. Section nav (FEED / DISCOVER / MARKET) and paginated post feed.
tags: [web, page, home]
related:
  - docs/apps/web/spec/pages/index.md
  - docs/apps/web/spec/pages/discover/page.md
  - docs/apps/web/spec/pages/business/overview.md
  - docs/apps/query-api/spec/home-feed.md
type: spec
status: active
scope: web
updated_at: 2026-08-06
---

# Home page (`/`)

**Back:** [web overview](../../overview.md) · **Related:** [seo](../seo.md) · **API:** [home feed](../../../query-api/spec/home-feed.md)

## Purpose

App root landing under `(app)/(hub)`. Shows hub section nav and a paginated post feed (global for guests, personalized when logged in). Metadata via `@/seo`.

## Route

| Item | Detail |
|------|--------|
| Path | `/` — `apps/web/src/app/(app)/(hub)/page.tsx` |
| Shell | `(app)/layout.tsx` (AppHeader) + `(hub)/layout.tsx` (FEED / DISCOVER / MARKET nav) |
| Loading | `(hub)/loading.tsx` — `FeedPostsLoadingSkeleton` |
| Content | `HomeFeedPostsList` with infinite scroll |

## Feed behavior

| Viewer | Data source |
|--------|-------------|
| Guest | `POST /query/v1/posts/feed` — all root posts, newest first |
| Logged-in | Same endpoint with `X-Viewer` — followed authors, followed objects, authority objects |

RSC seeds first page (`limit: 20`); load-more via `loadMoreHomeFeedAction` server action. Uses `FeedList` / `FeedPostGrid` from `@/modules/feed/presentation` (same Story cards as profile feed).

**Own posts (logged-in):** the viewer's root posts appear only when they follow themselves, tag a followed object, or have admin/ownership on a linked object — not implicitly. See [query-api home feed spec](../../../query-api/spec/home-feed.md).

## Empty state copy

Keys `home_feed_empty_global` and `home_feed_empty_personalized` are **English in all locale catalogs** (same convention as hub nav brand labels FEED / DISCOVER / MARKET). Translate when product requests localized empty states.

## Hub section nav

Shared by `/`, `/discover`, `/business*`. Tools routes keep hub layout but are not listed in section nav — see [tools/page.md](../tools/page.md).

| Tab | Route | Active |
|-----|-------|--------|
| FEED | `/` | exact `/` |
| DISCOVER | `/discover` | `/discover` prefix |
| MARKET | `/business` | `/business` prefix |

## Metadata

`generateMetadata` → `buildHomeMetadata({ locale, messages })` from `@/seo`.

Included in `app/sitemap.ts` with `priority: 1`, `changeFrequency: daily`.

## Verification

| Command | Purpose |
|---------|---------|
| `pnpm nx run web:typecheck` | Types |
| Manual | Guest `/` shows global posts + scroll load-more; logged-in shows personalized feed; `/@user` has no hub nav |

## Related code paths

| Path | Role |
|------|------|
| `apps/web/src/app/(app)/(hub)/page.tsx` | Home RSC + initial feed fetch |
| `apps/web/src/app/(app)/(hub)/home-feed.actions.ts` | Load-more server action |
| `apps/web/src/modules/home/presentation/components/home-feed-posts-list.tsx` | Client list + infinite scroll |
| `apps/web/src/modules/home/infrastructure/clients/home-feed.client.ts` | query-api client |
| `apps/web/src/seo/application/build-home-metadata.ts` | Title/description |
