# Post discussion thread (read, Hive)

**Back:** [query-api README](../README.md)

## HTTP

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/query/v1/posts/{author}/{permlink}/discussion` | Comment tree for a root post via `bridge.get_discussion` (`HiveClient.getState`). |

## Request headers (optional)

| Header | Role |
|--------|------|
| `X-Viewer` | Per-comment `votes.voted` and root `rebloggedByViewer` |

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
