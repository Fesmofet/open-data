---
id: web-editor-publish-metadata
title: Editor — Hive post publish metadata
description: "Hive `json_metadata` fields written when publishing from the post editor."
type: spec
status: active
scope: web
tags: [web, editor, hive]
updated_at: 2026-06-17
related:
  - docs/spec/data-model/post-object-related-images.md
---

# Editor — Hive post publish metadata

## `json_metadata.image`

Root posts store images in **`image`** as a **string array of HTTPS URLs** (not IPFS CIDs). The editor collects CIDs from Lexical `post-image` nodes and resolves them via `IPFS_CONTENT_BASE_URL` at publish time.

Implementation: `buildHivePostImageMetadata` in `apps/web/src/modules/editor/application/build-hive-post-image-metadata.ts`, used by `use-editor-post-publish.ts`.

Post body uses markdown `![alt](url)`; `image` duplicates URLs for Hive/Waivio feed previews and for chain-indexer Related album sync.
