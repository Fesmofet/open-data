---
id: docs-spec-data-model-post-object-related-images
title: PostgreSQL — post_object_related_images
description: "Virtual Related gallery rows: post json_metadata.image URLs linked to objects via post_objects."
type: spec
status: active
scope: platform
tags: [platform, domain, data-model, gallery]
updated_at: 2026-06-17
related:
  - docs/spec/data-model/posts.md
  - docs/spec/data-model/post-json-metadata-objects.md
  - docs/apps/query-api/spec/object-related-album.md
---

# post_object_related_images

Normative DDL: [schema.sql](schema.sql). Kysely: `PostObjectRelatedImagesTable` in `@opden-data-layer/core`.

## Purpose

Stores **virtual Related album** images for objects. Each row is one HTTPS image URL from a Hive post's `json_metadata.image`, linked to an object that appears in `post_objects` for that post.

- **Not** on-chain gallery data (`imageGallery` / `imageGalleryItem` updates).
- **Not** user-editable — rows are written only by chain-indexer and Mongo post migration.
- One row per `(object_id, author, permlink, image_url)`.

## Write path

1. **Root post upsert** — full replace for `(author, permlink)` after `post_objects` sync.
2. **Comment object bind** — append rows for newly bound objects on the parent post.
3. **Mongo posts migration** — derive from `json_metadata.image` + `post_objects`.

Eligible `object_type` values match legacy `OBJECT_TYPES_WITH_ALBUM` (intersection with ODL registry). Image URLs must be HTTPS strings.

## Read path

query-api exposes preview and paginated list; posts listed in object `remove` updates are excluded at read time.

## Columns

| Column | Role |
|--------|------|
| `object_id` | FK → `objects_core` |
| `author`, `permlink` | FK → `posts` (source post) |
| `image_url` | HTTPS URL from `json_metadata.image` |
| `sort_ord` | Index in the post's `image` array (0-based) |
