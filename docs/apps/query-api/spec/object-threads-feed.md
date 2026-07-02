# Object threads feed

`POST /query/v1/objects/:objectId/threads` — paginated threads for an object's Reviews > Threads sub-tab.

## Purpose

Ports legacy Waivio `GET /api/thread/hashtag` (`getThreads.byHashtag`) to the ODL Postgres schema. Returns the same `UserBlogFeedResponse` shape as `POST /query/v1/users/:name/threads`.

## Request

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `limit` | int 1–50 | 20 | Page size |
| `cursor` | string | — | Opaque keyset cursor (`feedAt` = `created_unix`, `author`, `permlink`) |
| `sort` | `latest` \| `oldest` | `latest` | Sort by `threads.created_unix` |
| `currency` | enum | USD | Accepted for API parity; thread items have empty payout fields |

Headers: `X-Viewer` (mutes + vote preview from `thread_active_votes`). Locale headers are accepted but **not** used to filter threads (legacy `byHashtag` had no language filter).

## Selection logic

1. Object must exist in `objects` (`objects_core`).
2. Threads where `deleted = false` and **`objectId = ANY(threads.hashtags)`** (exact token match).
   - `threads.hashtags` stores `#hashtag` tokens without `#` and `/object/slug` paths from thread bodies/metadata.
   - Works for all object types; non-hashtag objects show threads that reference their `object_id` in hashtags.
3. **Muted authors** — when `X-Viewer` is set, authors in the viewer's mute list are excluded (`user_account_mutes`).

Pagination: keyset on `(created_unix, author, permlink)` with `limit + 1` probe for `hasMore` (not legacy `skip`).

## Response

Same `UserBlogFeedResponse` as user threads:

- `items[]` — thread cards (`title` empty, `category` = thread type, `objects` empty, payouts empty).
- `votes` — from `thread_active_votes`.
- `cursor` / `hasMore` — standard feed cursor encoding.

## HTTP status vs empty body

| Case | Status | Body |
|------|--------|------|
| Unknown object | 404 | — |
| Valid object, no matching threads | 200 | `{ items: [], cursor: null, hasMore: false }` |
| Invalid cursor | 200 | empty feed |

## Divergence from object posts feed

| Topic | Object posts | Object threads |
|-------|--------------|----------------|
| Locale / `post_languages` | Hashtag objects filter by locale | No language filter |
| Data source | `posts` + `post_objects` / links / news filter | `threads.hashtags` array |
| Pinned prepend | Yes (`pin` updates) | No |

## Web integration

- Lazy client fetch: `ObjectThreadsFeedList` mounts only when Reviews > **Threads** sub-tab is active (no SSR fetch on Reviews landing).
- Cache tag: `query-api:object:{id}:threads-feed`; invalidated via `revalidateObjectAfterBroadcast`.

## MCP

Tool: `get_object_threads` — mirrors HTTP with `object_id`, `limit`, `cursor`, `sort`, `currency`, and locale context params.

## Verification

```bash
pnpm nx test query-api --testPathPatterns="get-object-threads-feed|thread-feed-hydrator"
pnpm nx test web --testPathPatterns="object-primary-content.spec"
pnpm nx build query-api
pnpm typecheck:web
```
