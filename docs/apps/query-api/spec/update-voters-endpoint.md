---
id: docs-apps-query-api-spec-update-voters-endpoint
title: Update voters endpoint
description: Approve/reject voter lists for a single object update (`GET /query/v1/objects/{objectId}/updates/{updateId}/voters`).
type: spec
status: active
scope: query-api
tags: [query-api, object-updates, voters]
updated_at: 2026-06-16
related:
  - docs/apps/query-api/spec/overview.md
  - docs/apps/web/spec/pages/object/routes/updates.md
---

# Update voters endpoint

`GET /query/v1/objects/:objectId/updates/:updateId/voters`

On-demand voter lists for the object update vote report modal. Feed payloads include up to three preview usernames per side; this endpoint returns full lists when the user opens the modal.

## Response

| Field | Type | Description |
|-------|------|-------------|
| `for_count` | number | Latest approve votes (one per voter) |
| `against_count` | number | Latest reject votes |
| `for_voters` | array | Approve rows with `voter` + `profile` |
| `against_voters` | array | Reject rows |

Each profile: `name`, `displayName`, `avatarUrl`. Each row includes `event_seq` (stringified packed chain position of the voter's latest vote) and `privileged_tier` (`admin`, `trusted`, or `null`) when the voter is a governance admin or a trusted user with object authority (same rules as LWAW/LWTW). No vote percent or USD fields.

Latest vote per voter uses max `event_seq` (same rule as `viewer_vote` on the feed).

## Errors

| Status | When |
|--------|------|
| 404 | Update not found for object |

## Verification

```bash
pnpm nx test query-api -- --testPathPatterns=resolve-latest-validity-votes|get-update-voters
```
