---
id: docs-apps-web-spec-object-update-detail
title: Object update detail URL
description: Deep link to a single object update card from notifications.
type: spec
status: active
scope: web
tags: [web, object, updates, notifications]
updated_at: 2026-07-31
related:
  - docs/apps/notifications/spec/message-builder.md
  - docs/apps/query-api/spec/object-update-by-id-endpoint.md
---

# Object update detail URL

## Public URL

`/object/:objectId/updates/:updateId`

Example: `/object/ivm-test-business-all/updates/40eb7d14330af9ab34066fdc9b190ecd3d4b34f4-7-0-0`

## Routing

`apps/web/src/proxy.ts` rewrites the path to the object page shell with:

- `?tab=updates`
- `object_update_id=<updateId>` (internal query param)

The address bar keeps the clean `/updates/:updateId` path.

## UI

Full object page shell (left rail, right rail). Center column:

1. **Back** link → `/object/:objectId/updates` (no filters)
2. Single [`UpdateCard`](../../../../apps/web/src/modules/object-updates/presentation/components/update-card.tsx) for the update

Data: `GET /query/v1/objects/:objectId/updates/:updateId` via `fetchObjectUpdateById`.

## Notifications

`update_vote_cast` notification `href` uses `objectUpdatePath` from `@opden-data-layer/notifications-messages`.
