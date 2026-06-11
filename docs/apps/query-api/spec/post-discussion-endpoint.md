---
id: docs-apps-query-api-spec-post-discussion-endpoint
title: Post discussion thread
description: Query `currency` (optional, default `USD`) — see post reward.
type: spec
status: active
scope: query-api
tags: [query-api, post-discussion-endpoint]
updated_at: 2026-06-10
related:
  - docs/apps/query-api/spec/overview.md
  - docs/README.md
---

# Post discussion thread (read, Hive)

**Back:** [query-api overview](overview.md)

## HTTP

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/query/v1/posts/{author}/{permlink}/discussion` | Comment tree for a root post via `bridge.get_discussion` (`HiveClient.getState`). |

## Request headers (optional)

| Header | Role |
|--------|------|
| `X-Viewer` | Per-comment `votes.voted` and root `rebloggedByViewer` |

Query `currency` (optional, default `USD`) — see [post reward](post-reward.md).

## Response: `PostDiscussionResponse`

| Field | Description |
|-------|-------------|
| `rootAuthor`, `rootPermlink` | Root post keys |
| `rebloggedUsers` | From Hive root content |
| `rebloggedByViewer` | Viewer in `rebloggedUsers` or `post_reblogged_users` |
| `rootCommentIds` | Depth-1 comment ids (`author/permlink`) |
| `childrenById` | Parent id → ordered child ids |
| `comments` | Map of id → `FeedStoryItem` (excerpt, votes, etc.) |

## v1 gaps vs legacy Waivio

- No Mongo `mergeSteemCommentsWithDB` enrichment
- No hidden/muted comment filtering
