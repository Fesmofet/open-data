---
id: docs-apps-query-api-spec-user-expertise
title: User expertise endpoints
description: "Read-path expertise for user profiles: scope counters and paginated object lists."
type: spec
status: active
scope: query-api
tags: [query-api, users, expertise]
updated_at: 2026-07-03
related:
  - docs/apps/query-api/spec/overview.md
  - docs/apps/web/spec/pages/user-profile/routes/expertise.md
  - docs/apps/scheduler/spec/post-expertise.md
---

# User expertise endpoints

**Back:** [query-api overview](overview.md)

## Purpose

Expose per-user object expertise for profile `/@:name/expertise-*`:

- Rows from `user_object_expertise` joined with `objects_core`
- `weight > 0` only
- Only `objects_core.status = 'active'` rows (inactive objects excluded from counters and lists)
- Scope: `hashtags` (`object_type = 'hashtag'`) or `objects` (all other types)

## Endpoints

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/query/v1/users/:name/expertise/counters` | `{ hashtagsCount, objectsCount }` |
| `GET` | `/query/v1/users/:name/expertise/objects` | `{ items: ObjectListItem[], total, hasMore }` |

### Query (`GET .../expertise/objects`)

| Param | Notes |
|-------|-------|
| `scope` | Required: `hashtags` or `objects` |
| `skip` / `limit` | Offset pagination; default limit 30, max 100 |

Sort: `user_object_expertise.weight DESC`, `object_id ASC`. Each item includes `user_weight` (expertise for that user on the object). `hasMore` uses a `limit + 1` probe on the expertise join (not `skip + items.length < total`).

### Headers

Same as other user object lists: `Accept-Language` / `X-Locale`, optional `X-Viewer`, `X-Governance-Object-Id`.

## Web client

`apps/web` module `user-profile`: `fetchExpertiseCounters`, `fetchExpertiseObjects`; cache tags `userExpertiseCounters`, `userExpertise`.

## MCP

- `get_user_expertise_counters`
- `get_user_expertise_objects`
