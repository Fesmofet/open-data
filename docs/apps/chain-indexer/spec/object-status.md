---
id: docs-apps-chain-indexer-spec-object-status
title: Object status
description: Track **visibility / lifecycle** state on `objects_core` without deleting rows. Default is **`active`**. Materialized from vote-winning status updates.
type: spec
status: active
scope: chain-indexer
tags: [chain-indexer, object-status]
updated_at: 2026-08-25
related:
  - docs/apps/chain-indexer/spec/overview.md
  - docs/apps/query-api/spec/objects-resolve.md
  - docs/spec/governance-resolution.md
  - docs/README.md
---

# Object status (`objects_core.status`)

## Purpose

Track **visibility / lifecycle** state on `objects_core` without deleting rows. Default is **`active`**.

Materialized **`objects_core.status`** is derived from the **vote-winning** `update_type: status` row (single-cardinality resolution + platform governance validity rules). It is **not** copied directly from the latest status update signer.

## Allowed values on core

`active`, `relisted`, `unavailable`, `closed`, `privacy_erasure`, `nsfw`, `flagged` — enforced in DB (`CHECK`), in TypeScript (`ObjectStatus` / `OBJECT_STATUS_VALUES` in `@opden-data-layer/odl-db-types`).

**`protected` is update-only** — it may appear in `object_updates.value_json.title` but is **never** stored on `objects_core`.

### Update payload titles

`UPDATE_STATUS_SCHEMA` (`libs/core/src/update-registry/updates/status.ts`) allows:

`active`, `protected`, `relisted`, `unavailable`, `closed`, `privacy_erasure`, `nsfw`, `flagged`

Web forms typically offer `protected`, `unavailable`, `closed`, `privacy_erasure`, `relisted`, `nsfw`, `flagged`. Core default remains `active` when no VALID status winner exists.

### Mapping update title → core status

| Winning update `title` | Materialized `objects_core.status` |
|------------------------|------------------------------------|
| `protected` | `active` |
| `active` | `active` |
| Other allowed titles | Same value (1:1) |
| No VALID status winner | `active` |

Search/discover endpoints still filter **`objects_core.status = 'active'`** only — so a winning `protected` status keeps the object visible.

### `closed`

Businesses, restaurants, places, and similar listings that are permanently closed. Products, services, and similar items that are discontinued. One stored value; web UI shows type-dependent labels (“Permanently closed” vs “Discontinued”).

### `privacy_erasure`

Object removed or redacted because it may contain personal or business-identifying information that must no longer remain publicly available under applicable privacy rules (e.g. GDPR Article 17, UK GDPR right to erasure, CCPA/CPRA right to delete, or similar).

## Payload shape

`value_json` is `{ title: '<status>', link?: '<object_id>' }`.

- **`title`** — one of the update schema values above.
- **`link`** — required **only when `title` is `relisted`**: object id / permlink of the relist target. Omitted or empty for other statuses.

## Who decides materialized status

**Validity voters** and the **platform governance snapshot** (`GovernanceCacheService.resolvePlatform()` → `GOVERNANCE_OBJECT_ID`). Any account may submit a status `update_create`; the winning VALID update (after votes) determines core status. There is **no admin-only gate** on materialization.

## Chain flow

1. ODL **`update_create`** with `update_type: 'status'` and `value_json: { title: '...', link?: '...' }` — row appended to **`object_updates`** (append-only history).
2. **`UpdateCreateHandler`** persists the update, emits **`OBJECT_STATUS_RECOMPUTE_EVENT`** (`ObjectStatusRecomputeEvent` with `objectId` only), and may emit **`object_status_change`** notification (payload title may be `protected`).
3. **`UpdateVoteHandler`** on status rows (`for` / `against` / `remove`) also emits **`OBJECT_STATUS_RECOMPUTE_EVENT`**.
4. **`ObjectStatusHandler`** loads aggregated object data, resolves the winning status via `ObjectViewService` + `materializeObjectCoreStatus()`, and updates **`objects_core.status`** only when the value changes. Tag-category sync may enqueue when crossing the active boundary.

Shared helper: `materializeObjectCoreStatus()` in `@opden-data-layer/objects-domain`.

## Operational backfill

After deploy, run [`scripts/backfill-object-statuses.ts`](../../../../scripts/backfill-object-statuses.ts) via migrator to align existing `objects_core.status` rows with vote-based rules:

```bash
docker compose -p apps --env-file .env -f docker-compose.production.apps.yml --profile tools run --rm migrator \
  pnpm exec tsx scripts/backfill-object-statuses.ts
```

CLI: `pnpm backfill:object-statuses [--dry-run] [--batch-size 200] [--object-id <id>]`

Requires `POSTGRES_*` and optionally **`GOVERNANCE_OBJECT_ID`** (same as chain-indexer). Empty `GOVERNANCE_OBJECT_ID` → `DEFAULT_GOVERNANCE_SNAPSHOT`.

Default scope: distinct `object_id` from `object_updates` where `update_type = 'status'`.

## Query API visibility

| Surface | Rule |
|---------|------|
| Search, discover, favorites, category lists, nested/ref cards of other objects | `status = 'active'` only |
| Direct object page (`POST /objects/resolve` + page tabs) | All statuses (`OBJECT_PAGE_VISIBLE_STATUSES` — currently every allowed core value) |

Non-active objects are absent from discovery endpoints. The object page loads for every status by direct URL; hard-hide of specific statuses (e.g. `privacy_erasure`) can be added later by narrowing `OBJECT_PAGE_VISIBLE_STATUSES`.

## Related

- [ODL pipeline](odl-pipeline.md) — status recompute in §7.
- [Data model flow](../../../spec/data-model/flow.md) — `objects_core` row shape.

## Verification

- `pnpm nx test chain-indexer -- --testPathPatterns=object-status`
- `pnpm nx test objects-domain -- --testPathPatterns=materialize-object-core-status`
- `pnpm nx test core -- --testPathPatterns=status`
- `pnpm backfill:object-statuses --dry-run`
