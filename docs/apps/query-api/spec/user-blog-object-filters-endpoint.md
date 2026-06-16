---
id: query-api-user-blog-object-filters
title: User blog object filters endpoint
description: "GET /query/v1/users/:name/blog/object-filters — faceted object filters for profile blog feed."
type: spec
status: active
scope: query-api
tags: [query-api, feed, users]
updated_at: 2026-06-16
related:
  - docs/apps/query-api/spec/user-blog-feed-endpoint.md
---

# User blog object filters

**HTTP:** `GET /query/v1/users/{name}/blog/object-filters`

## Query

| Param | Description |
|-------|-------------|
| `objects` (repeated) | Active `object_id` filters (AND). Narrows facet counts to posts that contain every listed object. |

## Response

```json
{
  "items": [
    { "object_id": "waivio", "name": "Waivio", "count": 5 }
  ]
}
```

- `name` from object projection; falls back to `object_id`.
- Sorted by `count` descending.
- Data source: `post_objects` scoped to user blog posts (own root posts + reblogs).

## Related

- Blog feed filter body: `POST /query/v1/users/{name}/blog` with `object_ids` (AND).
