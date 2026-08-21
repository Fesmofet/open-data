---
id: web-pages-object-routes-ownership
title: Object page — ownership
description: Ownership tab lists supervised and exclusive holders via GET /query/v1/objects/:id/ownership.
tags: [web, page, object, ownership]
related:
  - docs/apps/web/spec/pages/object/page-shell.md
type: spec
status: active
scope: web
updated_at: 2026-08-21
---

# Object ownership list (primary tab)

**Back:** [web overview](../../overview.md)

## Route

- **URL:** `/object/[object-id]/ownership` with optional `?sub=supervised|exclusive` (default `supervised`) and the same `?sort=` as user social lists. Legacy `/authority` rewrites to `/ownership`.
- **Sub-tabs:** Supervised vs exclusive counts from resolve (`supervised_count`, `exclusive_count`); lists via `GET /query/v1/objects/:id/ownership?ownership_type=…`.
- **App files:** `apps/web/src/app/(app)/object/[object-id]/page.tsx`, `ownership/object-ownership.actions.ts`

## Data

- **API:** `GET /query/v1/objects/:objectId/ownership` via {@link apps/web/src/modules/object/infrastructure/clients/object-ownership.client.ts}.
- **Resolve / projection:** `hasSupervisedOwnership`, `hasExclusiveOwnership`, `hasOwnershipAuthority` (aggregate) when `X-Viewer` is set.
- **Headers:** optional `X-Viewer` for claim/remove button state and `isCurrentFollowing` on each row.

## UX

- **Sort:** same `UserSocialSubscriptionSort` + `?sort=` as followers (`router.replace` on current pathname under `/object/.../ownership`).
- **Load more:** {@link apps/web/src/app/(app)/object/[object-id]/ownership/object-ownership.actions.ts} with {@link apps/web/src/modules/user-social/constants}.
- **UI:** {@link apps/web/src/modules/object/presentation/components/object-ownership-sub-nav.tsx} + {@link apps/web/src/modules/user-social/presentation/components/user-social-account-list.tsx}.

## Claim actions

- **Exclusive / supervised claim:** `buildOdlObjectOwnershipOp` — `method: 'add' | 'remove'`, `ownershipType: 'exclusive' | 'supervised'`.
