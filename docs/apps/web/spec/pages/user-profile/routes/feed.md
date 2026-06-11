---
id: web-pages-user-profile-routes-feed
title: User profile feed tabs
description: "Posts, threads, comments, mentions, and activity under `/@:name`. Each tab is a separate App Router segment under `(profile)/(main)/`."
type: spec
status: active
scope: web
tags: [web, page, user-profile, feed]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/overview.md
  - docs/apps/web/spec/pages/user-profile/profile-shell.md
  - docs/apps/web/spec/feed.md
  - docs/apps/web/spec/pages/user-profile/routes/post-article.md
---

# User profile — feed tabs

**Back:** [profile shell](../profile-shell.md) · [web overview](../../../overview.md) · **Related:** [feed.md](../../../feed.md), [post-article.md](post-article.md)

## Purpose

Posts, threads, comments, mentions, and activity under `/@:name`. Each tab is a separate App Router segment under `(profile)/(main)/`.

## Routes

| Public URL | App Router file | `feedTab` |
|------------|-----------------|-----------|
| `/@:name` | `(main)/page.tsx` | `posts` |
| `/@:name/threads` | `(main)/threads/page.tsx` | `threads` |
| `/@:name/comments` | `(main)/comments/page.tsx` | `comments` |
| `/@:name/mentions` | `(main)/mentions/page.tsx` | `mentions` |
| `/@:name/activity` | `(main)/activity/page.tsx` | `activity` |

Subnav links: [user-menu.md](../components/user-menu.md) + [user-profile-subnav.ts](../../../../../apps/web/src/modules/user-profile/presentation/components/user-profile-subnav.ts).

## Module layout

| Piece | Location |
|-------|----------|
| Shared loader UI | [`feed-profile-content.tsx`](../../../../../apps/web/src/app/(app)/user-profile/[name]/feed-profile-content.tsx) |
| Posts list + infinite scroll | [`blog-feed-posts-list.tsx`](../../../../../apps/web/src/app/(app)/user-profile/[name]/blog-feed-posts-list.tsx) |
| Feed queries | `@/modules/feed` — `getUserBlogFeedPageQuery`, `getUserThreadsFeedPageQuery`, etc. |
| Server actions (load more) | `blog-feed.actions.ts`, `threads-feed.actions.ts`, `comments-feed.actions.ts`, `mentions-feed.actions.ts` |

## Behavior

- **Posts:** `getUserBlogFeedPageQuery`; supports tag filter via query `?tags=` (comma-separated) on the posts tab.
- **Threads / comments / mentions:** respective feed queries with `sort: 'latest'` default.
- **Activity:** mock feed via `getMockFeedItems()` until query-api activity endpoint is wired.
- **Viewer context:** `createCookieAuthContextProvider().getUser()` passed into queries for vote/follow state.
- **Pagination:** RSC seeds `initialPage`; client uses `useSyncedPaginatedList` + `useInfiniteScroll` (see [feed.md](../../../feed.md)).
- **SEO:** default feed page `generateMetadata` → `buildProfileMetadata` + optional `Person` JSON-LD via `@/seo`.

## Verification

| Command | Purpose |
|---------|---------|
| `pnpm nx test web --testPathPattern=feed` | Feed module unit tests |
| Manual | Each tab under `/@:name`; post permalink opens modal intercept or full article per [post-article.md](post-article.md) |

## Related code paths

| Path | Role |
|------|------|
| `apps/web/src/app/(app)/user-profile/[name]/(profile)/(main)/page.tsx` | Posts tab + metadata |
| `apps/web/src/modules/feed/application/queries/get-user-blog-feed.query.ts` | Blog feed read |
