---
id: docs-apps-chain-indexer-spec-post-object-related-images-sync
title: Post object related images sync
description: "Materialize virtual Related gallery rows from Hive post json_metadata.image and post_objects."
type: spec
status: active
scope: chain-indexer
tags: [chain-indexer, hive-ingestion, gallery]
updated_at: 2026-06-17
related:
  - docs/spec/data-model/post-object-related-images.md
  - docs/apps/query-api/spec/object-related-album.md
  - docs/apps/chain-indexer/spec/hive-ingestion.md
---

# Post object related images sync

**Back:** [chain-indexer overview](overview.md) · **Data model:** [post-object-related-images.md](../../../spec/data-model/post-object-related-images.md)

## Purpose

Populate `post_object_related_images` — one row per `(object_id, author, permlink, image_url)` for eligible object types. Images come from root post `json_metadata.image` (HTTPS URLs only).

## Write paths

| Trigger | Service | Behavior |
|---------|---------|----------|
| Root post upsert | `PostRelatedImagesSyncService.syncForPost` | Full replace for `(author, permlink)` after `post_objects` sync |
| Comment object bind | `appendForNewBindings` | Append rows for newly bound objects on parent post |

Both run in the **same DB transaction** as `post_objects` writes (`PostUpsertService`, `CommentPostObjectBindService`).

## Eligible types

`OBJECT_TYPES_WITH_RELATED_ALBUM` in `@opden-data-layer/core/post-related-images` (legacy `OBJECT_TYPES_WITH_ALBUM` ∩ ODL registry).

## Code

| Piece | Path |
|-------|------|
| Sync service | `apps/chain-indexer/src/domain/hive-comment/post-related-images-sync.service.ts` |
| Repository | `apps/chain-indexer/src/repositories/post-object-related-images.repository.ts` |
| Post upsert hook | `apps/chain-indexer/src/domain/hive-comment/post-upsert.service.ts` |
| Comment bind hook | `apps/chain-indexer/src/domain/hive-comment/comment-post-object-bind.service.ts` |

## Read path

query-api serves preview and paginated list; not written by chain-indexer on read. See [object-related-album.md](../../query-api/spec/object-related-album.md).

## Mongo backfill

`pnpm migrate:mongo-posts` derives rows from export JSON — see [migrate-mongo-to-pg README](../../../../scripts/migrate-mongo-to-pg/README.md).
