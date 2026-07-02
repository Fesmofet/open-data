---
id: docs-spec-data-model-post-languages
title: Post languages
description: How Hive post languages are detected, stored in Postgres, and used in query filters.
type: spec
status: active
scope: platform
tags: [data-model, posts, language]
updated_at: 2026-07-02
related:
  - docs/spec/data-model/posts.md
  - docs/apps/chain-indexer/spec/post-languages.md
  - docs/apps/query-api/spec/object-posts-feed.md
---

# Post languages

## Storage format

Table **`post_languages`** (`author`, `permlink`, `language`) stores **primary language subtags** only — e.g. `en`, `es`, `zh` — not full BCP-47 region tags like `en-US`.

| Column | Format | Example |
|--------|--------|---------|
| `post_languages.language` | Primary BCP-47 language subtag | `en` |
| `object_updates.locale` | Full BCP-47 tag (optional region) | `en-US` |

Do not confuse `post_languages.language` with `object_updates.locale`; they serve different purposes.

A post may have **0–2** language rows (multi-value). No row means the post has no detected language tags.

## Write path (chain-indexer)

On Hive `comment` create/update, `PostUpsertService` runs language detection and replaces `post_languages` rows for that post.

See [chain-indexer post-languages spec](../../apps/chain-indexer/spec/post-languages.md) for ELD policy and triggers.

## Migration (Mongo → Postgres)

Legacy Mongo posts stored `languages: ['en-US', …]`. The migration script [`scripts/migrate-mongo-to-pg/posts/normalize-post-language.ts`](../../../../scripts/migrate-mongo-to-pg/posts/normalize-post-language.ts) normalizes each tag to the primary subtag via `Intl.Locale` before insert.

## Read path (query-api)

Request locales are often full tags (`en-US` from `Accept-Language`). Filters expand via `expandPostLanguageTags()` in `@opden-data-layer/core` so `en-US` matches stored `en`.

Used today for **hashtag** object Reviews feeds — see [object-posts-feed.md](../../apps/query-api/spec/object-posts-feed.md).

## Schema

DDL: [`schema.sql`](schema.sql) (`post_languages`), overview: [posts.md](posts.md).

Index: `idx_post_languages_language` on `(language)` for language-filtered feeds.
