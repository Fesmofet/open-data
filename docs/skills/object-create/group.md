---
title: Create group object
description: Agent playbook for ODL group — community or collection container.
type: playbook
status: active
scope: platform
tags: [object-create, object-create-playbook, group, agent]
related:
  - docs/skills/object-content-standards.md
---

# Create group object

Community or collection group container.

## When to use / not

- **Use** to group related objects under a shared parent.
- Often paired with `governance` for moderated communities.

## Product baseline fields

`name`, `description`, `image` (product policy).

## Field semantics

| Update | Semantics |
|--------|-----------|
| `parent` | Parent site or governance |
| `listItem` | Member or child object refs |

## Categories and tags (soft)

Per `supposed_updates` when present.

## Locales

See [object content standards](../object-content-standards.md).

## Research and source hierarchy

- Operator-provided structure only; dedupe child refs before linking.

## Images

Optional group avatar via IPFS per [object content standards](../object-content-standards.md).

## Special constraints

- Child refs must exist on chain before `listItem`.

## Verification

`resolve_object`: `fields.name`, child refs resolve.

## Related workflows

- [governance](governance.md)
