---
title: Hive thread create
description: Publish a Leo thread on an ODL object (Reviews > Threads) via a single Hive comment op and agent-wallet broadcast — no hive_build_post.
type: skill
status: active
scope: platform
tags: [hive, thread, leothreads, broadcast, agent, object]
related:
  - docs/skills/hive-blockchain-broadcast.md
  - docs/skills/hive-post-create.md
  - docs/skills/hive-has-agent-wallet.md
  - docs/apps/query-api/spec/object-threads-feed.md
  - docs/apps/web/spec/pages/object/routes/reviews.md
---

# Hive thread create

Playbook for publishing a **Leo thread** linked to an ODL object (Object page → Reviews → Threads).

## When to use

- User wants to post a short thread on an object (Reviews > Threads tab).
- Only broadcast after **explicit user approval**.

## When not to use

- Root Hive post / article / companion post → [hive-post-create.md](hive-post-create.md) (`hive_build_post`).
- Object Activity / DM / group channel → [osl-messaging.md](osl-messaging.md).
- Reply to an existing thread → `comment` on that thread's `author` / `permlink` (not covered here).

## One op — no `hive_build_post`

Agent-wallet has **`hive_build_post` only for root posts** (`parent_author: ''`) and **no Hive RPC**. Do **not** add or call `hive_build_thread`.

Build a single **`comment`** op and broadcast via **`wallet_broadcast`** / **`has_broadcast`**. No **`comment_options`** (same as web compose).

## Parent resolution (Leo)

Leo threads hang off the latest `leothreads` blog post:

```json
{
  "method": "condenser_api.get_discussions_by_blog",
  "params": [{ "tag": "leothreads", "limit": 1 }]
}
```

Use `posts[0].author` (`leothreads`) and `posts[0].permlink` as `parent_author` / `parent_permlink`. If empty, abort — parent is unavailable.

Web reference: [`resolveLeoThreadParent`](../../apps/web/src/modules/object/infrastructure/hive/resolve-leo-thread-parent.server.ts).

## Comment op

| Field | Value |
|-------|-------|
| `parent_author` | `leothreads` |
| `parent_permlink` | Latest blog permlink from RPC above |
| `author` | Signing Hive account |
| `permlink` | `re-{parentAuthor}-{parentPermlink}-{isoTime}` — see [`createCommentPermlink`](../../apps/web/src/shared/domain/hive-permlink.ts) |
| `title` | `''` (empty) |
| `body` | User text + object anchor (below) |
| `json_metadata` | JSON string: `{ "host": "<site>", "community": "…", "app": "…" }` — match web comment defaults ([`getHiveJsonMetadataDefaults`](../../apps/web/src/config/hive-json-metadata-public.ts)) |

## Object anchor in body

Append at broadcast time (do not show as user-authored copy in UI proposals):

- Default: `\n\n#{object_id}` when `object_id` matches `^[\w-]+$`.
- If `object_id` contains `.`, use `/object/{object_id}` instead — Leo `extractHashtags` is `#([\w-]+)` and truncates at dots.
- Skip append when body already contains `#object_id` or `/object/{object_id}` (case-insensitive).
- Empty body → `#object_id` alone.

Web helper: [`appendObjectAnchorToThreadBody`](../../apps/web/src/modules/object/domain/append-object-anchor-to-thread-body.ts).

## Do not use `json_metadata.objects`

Thread ↔ object linkage is **body hashtags only**. The indexer runs Leo `extractHashtags(body)` → `threads.hashtags`; query-api matches `objectId = ANY(threads.hashtags)`.

`json_metadata.objects` is ignored for threads. Do **not** use `hive_build_post`.

Spec: [object-threads-feed.md](../apps/query-api/spec/object-threads-feed.md).

## Agent workflow

1. Confirm object exists (`resolve_object` / query-api).
2. Resolve Leo parent via Hive RPC (`get_discussions_by_blog`).
3. Build `comment` op with anchored body and `json_metadata`.
4. **`wallet_broadcast`** or **`has_broadcast`** — only after user approval.
5. Verify: query-api **`get_object_threads`** (`POST /query/v1/objects/:id/threads`) or object Reviews > Threads UI.

## Related

- [Hive post create](hive-post-create.md) — root posts + `hive_build_post`
- [Hive blockchain broadcast](hive-blockchain-broadcast.md) — signing and broadcast
- [HAS agent wallet](../apps/agent-wallet/spec/overview.md) — `wallet_broadcast` (no thread builder)
- [Object Reviews threads UI](../apps/web/spec/pages/object/routes/reviews.md) — web compose behavior
