---
id: docs-apps-query-api-spec-object-related-album
title: Object Related album endpoints
description: "Virtual Related gallery: post-derived images for objects with eligible types."
type: spec
status: active
scope: query-api
tags: [query-api, objects, gallery]
updated_at: 2026-06-17
related:
  - docs/spec/data-model/post-object-related-images.md
  - docs/apps/web/spec/pages/object/routes/gallery.md
---

# Object Related album endpoints

Virtual **Related** gallery images come from Hive post `json_metadata.image` URLs linked to the object via `post_objects`. Not on-chain `imageGallery` data.

## Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/query/v1/objects/:objectId/gallery/related/preview` | Cover preview + total `count` |
| GET | `/query/v1/objects/:objectId/gallery/related` | Paginated album items |

## Query params

**Preview:** `limit` (default 4, max 50).

**List:** `limit` (default 20, max 50), `cursor` (numeric offset string).

## Response item

```json
{
  "url": "https://…",
  "postAuthor": "alice",
  "postPermlink": "my-post"
}
```

## REMOVE filter

Posts whose `author/permlink` appear in VALID object `remove` updates are excluded at read time (legacy parity).

## Write path

chain-indexer `PostRelatedImagesSyncService` and Mongo posts migration — see [post-object-related-images.md](../../../spec/data-model/post-object-related-images.md).
