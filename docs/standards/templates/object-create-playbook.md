---
title: Object create playbook template
description: Draft template for docs/skills/object-create/{objectType}.md — not indexed as a skill.
type: template
status: draft
scope: platform
tags: [object-create, template]
related:
  - docs/skills/object-content-standards.md
  - docs/spec/object-type-entity.md
---

# Create {objectType} object (template)

Copy to `docs/skills/object-create/{objectType}.md` and replace placeholders. Set `type: skill`, `status: active`, tag `object-create-playbook`.

## When to use / not

- **Use** when …
- **Not** when …

## Product baseline fields

From `get_object_create_playbook.required_updates` (product policy, not chain requirement). Call MCP for live list.

## Field semantics

Type-specific notes only. Schema: `get_update_schema`.

## Categories and tags (soft)

Only if type supports `category` / `tagCategory` / `tagCategoryItem`. See [object content standards](../../skills/object-content-standards.md).

## Research and source hierarchy

Trusted sources; omit unknown facts.

## Images

Type-specific crop/brief; common IPFS policy via [object content standards](../../skills/object-content-standards.md).

## Special constraints

Guards, allowed refs, single-writer rules.

## Verification

`resolve_object.fields.*` checks.

## Related workflows

- [Object content standards](../../skills/object-content-standards.md)
- [Object content routing](../../skills/object-content-routing.md)
