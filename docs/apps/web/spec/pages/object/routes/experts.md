---
id: web-pages-object-routes-experts
title: Object page — experts
description: "- **URL:** `/object/[object-id]/experts`. The path stays in the address bar; {@link apps/web/src/proxy.ts} rewrites internally to `/object/[object-id]?tab=experts`. - **App files:** `page.tsx`, `object-experts.actions.ts` - **UI:** {@link apps/web/src/modules/object/presentation/components/object-experts-account-list.tsx} in the center column when the **Experts** tab is active."
tags: [web, page, object, social, expertise]
related:
  - docs/apps/web/spec/pages/object/page-shell.md
type: spec
status: active
scope: web
updated_at: 2026-07-03
---

# Object experts list (primary tab)

**Back:** [web overview](../../overview.md)

## Route

- **URL:** `/object/[object-id]/experts`. The path stays in the address bar; {@link apps/web/src/proxy.ts} rewrites internally to `/object/[object-id]?tab=experts` (existing query preserved).
- **App files:** `apps/web/src/app/(app)/object/[object-id]/page.tsx`, `object-page-client.tsx`, `experts/object-experts.actions.ts`
- **UI:** {@link apps/web/src/modules/object/presentation/components/object-experts-account-list.tsx} in the object profile **center column** when the **Experts** primary tab is active.

## Data

- **API:** `GET /query/v1/objects/:objectId/experts` (query-api) via {@link apps/web/src/modules/object/infrastructure/clients/object-social.client.ts}.
- **Query:** `skip`, `limit` — offset pagination (no sort param; API orders by per-object expertise weight DESC).
- **Headers:** optional `X-Viewer` (cookie auth) for `isCurrentFollowing` on each row.
- **Tab badge:** `experts_count` on object resolve (`GET /query/v1/objects/resolve`) — count of accounts with `user_object_expertise.weight > 0` on this object.

## UX

- **Load more:** server action `loadMoreObjectExpertsAction` accumulates pages with {@link apps/web/src/modules/user-social/constants} `USER_SOCIAL_PAGE_SIZE`.
- Each row shows **per-object** `objectExpertiseWeight` (not global `wobjects_weight`).
- After follow/unfollow on this tab, `revalidateObjectAfterBroadcast` invalidates `objectExperts` cache tag so `isCurrentFollowing` refreshes without full reload.

## Right rail preview

Not implemented for experts (followers block only). See [pages/object/routes/right-rail.md](pages/object/routes/right-rail.md).
