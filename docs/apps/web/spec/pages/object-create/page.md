---
id: web-pages-object-create
title: Object create page
description: "Authenticated UI to compose a new object: type selection, dynamic fields from object-type registry, preview/health panels, and publish to Hive. Broadcast mechanics (chunking, IPFS) are in object-create-broadcast.md."
tags: [web, page, object-create]
related:
  - docs/apps/web/spec/object-create-broadcast.md
type: spec
status: active
scope: web
updated_at: 2026-06-10
---

# Object create page (`/object-create`)

**Back:** [web overview](../../overview.md) · **Related:** [object-create-broadcast](object-create-broadcast.md), [editor](pages/editor/page.md)

## Purpose

Authenticated UI to compose a new object: type selection, dynamic fields from object-type registry, preview/health panels, and publish to Hive. Broadcast mechanics (chunking, IPFS) are in [object-create-broadcast.md](../../object-create-broadcast.md).

## Route and access

| Item | Detail |
|------|--------|
| Path | `/object-create` — `apps/web/src/app/(app)/object-create/page.tsx` |
| Auth | Redirect to `/sign-in` when no session |
| Entry | Header account menu **Create object**; editor **Create new object** with `?return=` |

## Query params

| Param | Validation | After publish |
|-------|------------|---------------|
| `return` | Must parse to `/editor?draftId=…` via `parseObjectCreateReturnPath` | Redirect to editor with `attachObject={objectId}` |

## Module layout

| Layer | Location |
|-------|----------|
| Client screen | `@/modules/object-create` — `ObjectCreateClient`, form hooks |
| Build ops | `application/build-create-ops.ts`, `use-object-create-form.ts` |
| Domain | `generate-object-id`, field filters, validation |
| Preview panels | Shared with object edit — `ObjectPreviewPanel`, `ObjectHealthPanel` |

Server generates `initialObjectIdPrefix` via `generatePrefix()` per request.

## Behavior

- Form fields driven by `@opden-data-layer/core` object-type registry and supposed updates.
- **Publish dock:** same status pattern as editor (`PendingOpsDock` family).
- **Images:** IPFS upload via shared image actions; CID previews use `useIpfsContentBaseUrl()`.
- **Return to editor:** flush editor autosave before navigating to object-create; on success strip `attachObject` after editor consumes it.

## Verification

| Command | Purpose |
|---------|---------|
| `pnpm nx test web --testPathPattern=object-create` | Form/build-op unit tests |
| `pnpm nx test hive-broadcast` | Broadcast payload builders |
| Manual | Create from `/object-create`; create from editor with return path |

## Related code paths

| Path | Role |
|------|------|
| `apps/web/src/app/(app)/object-create/page.tsx` | Route + auth gate |
| `apps/web/src/modules/object-create/application/use-object-create-form.ts` | Publish + redirect |
