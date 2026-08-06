---
id: docs-apps-query-api-spec-home-feed
title: Home feed
description: Hub FEED tab post timeline — global for guests, personalized when X-Viewer is set.
type: spec
status: active
scope: query-api
tags: [query-api, home-feed]
updated_at: 2026-08-06
related:
  - docs/apps/query-api/spec/overview.md
  - docs/apps/web/spec/pages/home/page.md
---

# Home feed (read)

**Back:** [query-api overview](overview.md)

## HTTP

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/query/v1/posts/feed` | Paginated newest-first root posts for the hub FEED tab. |

## Modes

| Viewer | Feed scope |
|--------|------------|
| Guest (no `X-Viewer`) | All root posts in `posts`, ordered by `created_unix` DESC. |
| Logged-in (`X-Viewer`) | Posts matching **any** of: author in `user_subscriptions.following` for viewer; linked object in `user_object_follows` for viewer; linked object in `object_authority` for viewer (`administrative` or `ownership`). |

Muted authors (`user_account_mutes`) are excluded for logged-in viewers. Reblogs are not included in v1.

**Viewer's own posts:** included only when the viewer follows themselves, a followed object is linked on the post, or the viewer has admin/ownership authority on a linked object. Own root posts are **not** implicitly included.

## Performance

| Mode | Query shape | Index |
|------|-------------|-------|
| Guest | Root posts ordered by `created_unix DESC` | `idx_posts_root_created_unix` (partial, root rows) |
| Logged-in | Single query with `OR` of subscription `IN` + two correlated `EXISTS` on `post_objects` | Per-branch indexes; planner may scan heavily for users with many follows |

> **TODO:** Refactor personalized mode to **pushdown `UNION ALL`** + `mergeFeedBranches` (same pattern as [user blog feed](user-blog-feed-endpoint.md) / `docs/spec/data-model/posts.md`) so each branch uses its own index and keyset cursor before merge.

## Request body: `HomeFeedBody`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number (int, 1–50) | `20` | Page size. |
| `cursor` | string \| omitted | — | Opaque cursor from prior response. |
| `currency` | enum | `USD` | Reward display currency. |

## Response

Same shape as [User blog feed](user-blog-feed-endpoint.md): `UserBlogFeedResponse` with `items`, `cursor`, `hasMore`. Hydration uses `buildFeedStoryItemsFromPostPage`.

## Implementation

- Endpoint: `GetHomeFeedEndpoint`
- Repository: `PostsRepository.findHomeFeed`
- Controller: `PostsController.getHomeFeedRoute`
