---
id: docs-apps-chain-indexer-spec-object-status
title: Object status
description: Track **visibility / lifecycle** state on `objects_core` without deleting rows. Default is **`active`**.
type: spec
status: active
scope: chain-indexer
tags: [chain-indexer, object-status]
updated_at: 2026-07-21
related:
  - docs/apps/chain-indexer/spec/overview.md
  - docs/apps/query-api/spec/objects-resolve.md
  - docs/spec/governance-resolution.md
  - docs/README.md
---

# Object status (`objects_core.status`)

## Purpose

Track **visibility / lifecycle** state on `objects_core` without deleting rows. Default is **`active`**.

## Allowed values

`active`, `relisted`, `unavailable`, `closed`, `privacy_erasure`, `nsfw`, `flagged` — enforced in DB (`CHECK`), in the `status` update registry schema (`UPDATE_STATUS`), and in TypeScript (`ObjectStatus` / `OBJECT_STATUS_VALUES` in `@opden-data-layer/core`).

### `closed`

Businesses, restaurants, places, and similar listings that are permanently closed. Products, services, and similar items that are discontinued. One stored value; web UI shows type-dependent labels (“Permanently closed” vs “Discontinued”).

### `privacy_erasure`

Object removed or redacted because it may contain personal or business-identifying information that must no longer remain publicly available under applicable privacy rules (e.g. GDPR Article 17, UK GDPR right to erasure, CCPA/CPRA right to delete, or similar).

## Payload shape

`value_json` is `{ title: '<status>', link?: '<object_id>' }`.

- **`title`** — one of the allowed values above (forms typically offer `unavailable`, `closed`, `privacy_erasure`, `relisted`, `nsfw`, `flagged`; `active` is the default core state).
- **`link`** — required **only when `title` is `relisted`**: object id / permlink of the relist target. Omitted or empty for other statuses.

Validated in `UPDATE_STATUS_SCHEMA` (`libs/core/src/update-registry/updates/status.ts`).

## Who can change it

Only accounts listed as **platform governance admins** (`GovernanceCacheService.resolvePlatform()` → `snapshot.admins`) may apply a new status. Others’ `update_create` rows for `update_type: status` are still written to **`object_updates`**, but **`objects_core.status` is not updated** (logged warning).

## Chain flow

1. ODL **`update_create`** with `update_type: 'status'` and `value_json: { title: '<status>', link?: '...' }` (after existing guards and validation; `link` required when `title` is `relisted`).
2. **`UpdateCreateHandler`** persists the update, then emits **`OBJECT_STATUS_CREATED_EVENT`** (`ObjectStatusCreatedEvent` carries `objectId`, **signer** `creator`, and `status` from `title`).
3. **`ObjectStatusHandler`** listens, reloads the platform governance snapshot, and if the signer is in `admins`, runs `UPDATE objects_core SET status = …`.

## Query API visibility

| Surface | Rule |
|---------|------|
| Search, discover, favorites, category lists, nested/ref cards of other objects | `status = 'active'` only |
| Direct object page (`POST /objects/resolve` + page tabs) | All statuses (`OBJECT_PAGE_VISIBLE_STATUSES` — currently every allowed value) |

Non-active objects are absent from discovery endpoints. The object page loads for every status by direct URL; hard-hide of specific statuses (e.g. `privacy_erasure`) can be added later by narrowing `OBJECT_PAGE_VISIBLE_STATUSES`.

## Related

- [ODL pipeline](odl-pipeline.md) — governance cache note in §7.
- [Data model flow](../../../spec/data-model/flow.md) — `objects_core` row shape.

## Verification

- `pnpm nx test chain-indexer` — `object-status.handler.spec.ts`, `update-create.handler.spec.ts` (status emit).
