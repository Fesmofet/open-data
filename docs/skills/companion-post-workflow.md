---
title: Companion post workflow
description: Link a Hive post to an ODL object after create — json_metadata.objects and body references; build via hive-post-create.
type: skill
status: active
scope: platform
tags: [object-create, post, workflow, agent]
related:
  - docs/skills/hive-post-create.md
  - docs/spec/data-model/post-json-metadata-objects.md
  - docs/skills/hive-blockchain-broadcast.md
  - docs/skills/object-content-standards.md
---

# Companion post workflow

Add-on for publishing a **companion post** that references a created ODL object. For build, tags, beneficiaries, reward mode, and broadcast, follow **[hive-post-create.md](hive-post-create.md)**.

## Prerequisites

1. Object must exist on chain (indexer drops unknown ids from `post_objects`).
2. User explicitly requested publication (draft preparation is OK without broadcast).

## What is specific to companion posts

1. **`json_metadata.objects`** per [post-json-metadata-objects.md](../spec/data-model/post-json-metadata-objects.md):
   - Typically `[{ "object_id": "<id>", "percent": 100 }]`
   - Sum of percents ≤ **100**
2. **Body** should link to or describe the object (Waivio `/object/…` URLs, name, hero image).
3. **Tags** — include at least one WAIV-eligible tag when WAIV potential matters (see [hive-post-create.md](hive-post-create.md)); e.g. `food` for recipes.

## Steps

1. Create or confirm object via object-create workflow.
2. Draft title/body with source links and hero image (IPFS or canonical URL).
3. `hive_build_post` with `objects` (and `tags`, `body`, …) — see [hive-post-create.md](hive-post-create.md).
4. `wallet_broadcast` / `has_broadcast` only after user approval.
5. Verify post via query-api.

## Related

- [Hive post create](hive-post-create.md) — full post playbook + `hive_build_post`
- [Hive blockchain broadcast](hive-blockchain-broadcast.md)
- [Object content standards](object-content-standards.md)
