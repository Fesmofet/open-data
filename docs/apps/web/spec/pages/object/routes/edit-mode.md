---
id: web-pages-object-routes-edit-mode
title: Object page — edit mode
description: Logged-in users can toggle **Edit** on an object profile page and add new ODL updates from the left rail via a `+` control on each block (except Rating). Submissions broadcast a Hive `custom_json` `update_create` event, then follow the standard trx confirmation pattern.
tags: [web, page, object, edit]
related:
  - docs/apps/web/spec/pages/object/page-shell.md
type: spec
status: active
scope: web
updated_at: 2026-06-10
---

# Object edit mode (left rail updates)

**Back:** [web overview](../../overview.md) · **Related:** [updates.md](routes/updates.md), [auth.md](../../auth.md)

## Purpose

Logged-in users can toggle **Edit** on an object profile page and add new ODL updates from the left rail via a `+` control on each block (except Rating). Submissions broadcast a Hive `custom_json` `update_create` event, then follow the standard trx confirmation pattern.

## UX

| State | Behavior |
|-------|----------|
| View mode | Left rail read-only (existing blocks) |
| Edit mode | `+` next to each block heading (menu, description, phones, …) |
| `+` click | Modal: optional update-type select (multi-type blocks), schema-driven value form, optional locale when `UPDATE_REGISTRY[type].localizable` |
| Edit left rail | All supported slots show heading + `+` even when empty; order: **Name**, **Title**, then type-specific slots (see below) |
| Update count | Muted line under each field heading (e.g. `2 updates`); **click** navigates to the **Updates** tab and sets the feed `update_type` filter for that field |
| Submit | `buildOdlUpdateCreateOp` → wallet broadcast → `awaitTrxConfirmation` → `router.refresh()` |
| Creator vote | Indexer auto-inserts validity vote `for` from `creator` on every successful `update_create` (no client `update_vote` in create trx) |
| `object_ref` value | Debounced object search (same as menu item); submitted as `value_text` = referenced `object_id` |
| `geo` value | Latitude/longitude inputs + interactive map (click to set marker; inputs move marker) |
| `walletAddress` value | Cryptocurrency `<select>` (`WALLET_SYMBOLS` from core) + address + optional title |
| **Tags** block (edit) | Inline pills per `tagCategory`; header `+` adds a new `tagCategory` (inline compose, no modal); dashed **New tag** pill per category broadcasts `tagCategoryItem`; click pill → `update_vote` **for** (orange border when viewer voted for); **×** → `update_vote` **against**; category removal only via Updates tab |
| Tags data (MVP) | Only consensus-valid projected tags (`include_rejected=false`); per-viewer hide after reject deferred |

Edit mode and `+` buttons require a logged-in viewer (`viewerUsername` from server). The **Tags** block uses its own header `+` for categories instead of the generic add-update modal.

## Block → update type mapping

`apps/web/src/modules/object-updates/domain/block-update-type-map.ts` maps left-rail `kind` to `UPDATE_TYPES` values (camelCase). Candidates are filtered by `OBJECT_TYPE_REGISTRY[objectType].supported_updates` (via `embeddedUpdatesFeed.typeOptions` on the client).

### Left-rail slot order

- **Generic types:** `EDIT_MODE_LEFT_RAIL_BLOCK_ORDER` — Name, Title, Menu, … about stack (`left-rail-edit-blocks.ts`).
- **`product` / `book` / `service`:** legacy navigate cluster **before** menu — gallery → compareAtPrice → price → saleEvent → **options**, then menu (`resolveEditModeLeftRailBlockOrder` in `object-left-rail-order.ts`). See [options.md](options.md).

## Broadcast contract

Built by `@opden-data-layer/hive-broadcast` **`buildOdlUpdateCreateOp`** (single `update_create` event):

```json
{
  "events": [{
    "action": "update_create",
    "v": 1,
    "payload": {
      "object_id": "<id>",
      "update_type": "<camelCase type>",
      "creator": "<hive account>",
      "value_text | value_json | value_geo": "<validated value>",
      "locale": "<optional when localizable>"
    }
  }]
}
```

`chain-indexer` **`UpdateCreateHandler`** persists the update, then best-effort inserts a validity vote `for` from `creator` (idempotent on `(update_id, voter)`). Clients no longer bundle `update_vote` in the same broadcast for self-likes.

`chain-indexer` stores Hive `transaction_id` on rows from the block context (not from payload). On-chain `update_vote` events (other voters, tag reject/approve, etc.) still use explicit `update_id` or `create_event_id` resolution (`update-vote.handler.ts`).

- Hive `custom_json.id`: `useOdlCustomJsonId()` from runtime `ODL_NETWORK` (see [auth.md](../../auth.md)).
- Value field: `value_${value_kind}`, except `object_ref` → `value_text`.
- Client validation reuses `UPDATE_REGISTRY[update_type].schema` from `@opden-data-layer/core`.

## Key files

| Area | Path |
|------|------|
| ODL op builder | `libs/hive-broadcast/src/odl-operations.ts` |
| Block mapping | `apps/web/src/modules/object-updates/domain/block-update-type-map.ts` |
| Form utils | `apps/web/src/modules/object-updates/application/update-value-form.utils.ts` |
| Modal | `apps/web/src/modules/object-updates/presentation/components/add-update-modal.tsx` |
| Left rail | `apps/web/src/modules/object/presentation/components/object-left-rail-panel.tsx` |
| Tags left rail (edit) | `apps/web/src/modules/object/presentation/components/object-tags-left-rail-section.tsx` |
| Tag chip | `apps/web/src/modules/object-updates/presentation/components/tag-chip.tsx` |
| Tag vote stats | `apps/web/src/modules/object/infrastructure/tag-approval-stats.server.ts` |
| Update count badge | `apps/web/src/modules/object/presentation/components/left-rail-update-count-badge.tsx` |
| Block → filter | `resolveUpdateTypeFilterForBlockKind` in `block-update-type-map.ts` |
| Page wiring | `apps/web/src/app/(app)/object/[object-id]/object-page-client.tsx` |

## Verification

```bash
pnpm nx test hive-broadcast
pnpm nx test web
```
