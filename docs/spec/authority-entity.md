---
id: docs-spec-authority-entity
title: Object Authority Entity (superseded)
description: Legacy `object_authority` split into `object_favorite` and `object_ownership`. See linked specs.
type: spec
status: deprecated
scope: platform
tags: [platform, domain]
updated_at: 2026-08-21
related:
  - docs/spec/object-favorite.md
  - docs/spec/object-ownership.md
---

# Object Authority Entity (superseded)

> **Superseded.** Legacy `object_authority` was removed in migration `00057`. Use:
>
> - [object-favorite.md](object-favorite.md) — former `administrative` authority (heart / favorites; drives `object_reputation` and governance `authorities` search scope)
> - [object-ownership.md](object-ownership.md) — former `ownership` authority (`exclusive` / `supervised` claim; curator filter for trusted tier)

**Back:** [Spec index](README.md)

## Historical note

Before the split, one table stored `(object_id, account, authority_type)` with `authority_type ∈ { administrative, ownership }`. Hive action `object_authority` became `object_favorite` and `object_ownership` ODL actions.
