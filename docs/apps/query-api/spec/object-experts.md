---
id: docs-apps-query-api-spec-object-experts
title: Object experts endpoint
description: "List accounts with per-object expertise on an object page Experts tab."
type: spec
status: active
scope: query-api
tags: [query-api, objects, expertise]
updated_at: 2026-07-03
related:
  - docs/apps/query-api/spec/overview.md
  - docs/apps/query-api/spec/user-expertise.md
---

# Object experts endpoint

**Back:** [query-api overview](overview.md)

## Purpose

Mirror of user-profile expertise, inverted by object: list Hive accounts with `user_object_expertise.weight > 0` for a given `object_id`, sorted by per-object weight descending.

## Endpoint

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/query/v1/objects/:objectId/experts` | `{ items, total, hasMore }` |

### Query

| Param | Notes |
|-------|-------|
| `skip` / `limit` | Offset pagination; default limit 20, max 50 |

### Row fields

| Field | Source |
|-------|--------|
| `objectExpertiseWeight` | `user_object_expertise.weight` for this object |
| `usersFollowingCount` | `accounts_current.users_following_count` |
| `isCurrentFollowing` | `user_subscriptions` when `X-Viewer` set |

Not included: global `wobjects_weight` (lifetime aggregate).

### Object resolve

`POST /query/v1/objects/resolve` includes `experts_count` — count of accounts with `weight > 0` on the object (for Experts tab badge).

## Web client

`apps/web` object page: `fetchObjectExperts`, `getObjectExpertsPageQuery`; cache tag `objectExperts`.

## MCP

- `get_object_experts`
