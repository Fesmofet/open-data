---
id: docs-apps-chain-indexer-spec-osl-user-metadata
title: OSL update_user_metadata
description: Indexes user settings into user_metadata (locale, shop visibility, voting prefs).
type: spec
status: active
scope: chain-indexer
tags: [chain-indexer, osl, users]
updated_at: 2026-07-30
related:
  - docs/apps/chain-indexer/spec/osl-parser.md
  - docs/spec/data-model/users.md
  - docs/apps/chain-indexer/spec/object-categories.md
---

# OSL `update_user_metadata`

**Back:** [OSL parser](osl-parser.md) · **Table:** [user_metadata](../../../spec/data-model/users.md)

## Payload (v1)

Strict object (no `account` — PK is `ctx.creator`):

`notifications_last_timestamp`, `exit_page_setting`, `locale`, `post_locales`, `nightmode`, `reward_setting`, `rewrite_links`, `show_nsfw_posts`, `upvote_setting`, `vote_percent`, `voting_power`, `currency`, `hide_linked_objects`, `hide_recipe_objects`, `hide_favorite_objects` (defaults to `false` when omitted).

Handler: `UserMetadataHandler` in `apps/chain-indexer/src/domain/osl-parser/handlers/`.

## Persistence

- `UserMetadataRepository.upsertFull(account, payload)` — full-row `ON CONFLICT (account) DO UPDATE` (legacy Mongo document overwrite semantics).
- Requires existing `accounts_current` row (FK); failures are logged and swallowed.

## Domain events

After successful upsert: emits `UserMetadataChangedEvent` (`user_metadata.changed`) for shop category scope recompute (see [object-categories.md](object-categories.md)).

## IPFS batch replay

Historical IPFS `batch_import` child events may still contain `update_user_metadata`; `BatchImportWorker` replays them via `batchImportChildEventSchema` and the same handler (live path is OSL only).

## Client broadcast

`buildOslUpdateUserMetadataOp` in `@opden-data-layer/hive-broadcast` with `custom_json.id` = `osl-mainnet` / `osl-testnet`.
