---
id: docs-apps-query-api-spec-object-update-by-id-endpoint
title: Object update by id endpoint
description: Single object update feed card (`GET /query/v1/objects/{objectId}/updates/{updateId}`).
type: spec
status: active
scope: query-api
tags: [query-api, object-updates]
updated_at: 2026-07-31
related:
  - docs/apps/query-api/spec/overview.md
  - docs/apps/query-api/spec/update-voters-endpoint.md
  - docs/apps/web/spec/object-update-detail.md
---

# Object update by id endpoint

`GET /query/v1/objects/:objectId/updates/:updateId`

Returns one **object update feed item** (same DTO shape as a row in the paginated updates feed). Used by the web object update detail page and notification deep links.

## Response

Single `ObjectUpdateFeedItemDto` — see OpenAPI [`object-updates.openapi.ts`](../../../../apps/query-api/src/openapi/object-updates.openapi.ts).

Includes approval %, for/against counts, preview voters, viewer vote, decisive privileged vote, **`rank_score`** (decisive rank on the update), **`viewer_rank`** (viewer's latest rank vote when `X-Viewer` is set), image preview URLs, and geo when present.

## Errors

| Status | When |
|--------|------|
| `404` | Object not found, or update not found on that object |

## Implementation

- Endpoint: `GetObjectUpdatesFeedEndpoint.executeByUpdateId` in [`get-object-updates-feed.endpoint.ts`](../../../../apps/query-api/src/domain/object-updates/get-object-updates-feed.endpoint.ts)
- Repository: `UpdatesFeedRepository.findJoinRowByObjectAndUpdateId` — lookup by PK `update_id` with `object_id` validation

## Related

- Paginated feed: `GET /query/v1/objects/:objectId/updates`
- Voter modal: [`update-voters-endpoint.md`](update-voters-endpoint.md)
- Web routing: [`object-update-detail.md`](../../web/spec/object-update-detail.md)
