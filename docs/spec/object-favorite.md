---
id: docs-spec-object-favorite
title: Object Favorite
description: Heart / shop-scope edge for object favorites — `object_favorite` chain action, Postgres table, indexer side effects, and query-api surfaces.
type: spec
status: active
scope: platform
tags: [platform, domain]
updated_at: 2026-08-21
related:
  - docs/spec/object-ownership.md
  - docs/apps/chain-indexer/spec/odl-pipeline.md
---

# object_favorite

Heart / shop-scope edge: `(object_id, account)`.

## Chain action

`object_favorite` — payload `{ object_id, method: 'add' | 'remove' }`. Account = posting auth.

## Postgres

`object_favorite (object_id, account, event_seq, created_at)` — PK `(object_id, account)`.

## Side effects (indexer)

- **Add:** clears `user_shop_deselect` for that pair; emits `odl.object_favorite.changed` → category-related user shop scope recompute.
- **Remove:** same event.

## Query API

- `GET /objects/:id/favorited-by`
- Projection flag: `isFavorited`
- Count: `favorited_by_count`

## Migration

Legacy Mongo `authorities` field body `administrative` → `object_favorite` via `pnpm migrate:mongo-objects`.

@see docs/spec/object-ownership.md
@see docs/apps/chain-indexer/spec/odl-pipeline.md
