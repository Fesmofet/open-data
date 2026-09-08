---
title: Create shop object
description: Agent playbook for ODL shop — commerce container with products and navigation.
type: playbook
status: active
scope: platform
tags: [object-create, object-create-playbook, shop, agent]
related:
  - docs/skills/object-create/product.md
  - docs/skills/object-content-standards.md
---

# Create shop object

Shop or commerce container.

## When to use / not

- **Use** as parent for `product` objects and shop navigation.
- Products carry `price`; shop provides structure via `listItem` / `menuItem` / categories.

## Product baseline fields

`name`, `description`, `image` (product policy).

## Field semantics

| Update | Semantics |
|--------|-----------|
| `listItem`, `menuItem` | Navigation to products or categories |
| `sortCustom` | Catalog sort |
| `parent` | Site hierarchy |

## Categories and tags (soft)

Shop-level discover tags when supported — use `supposed_updates` keys only.

## Locales

See [object content standards](../object-content-standards.md).

## Research and source hierarchy

- Merchant catalog from official feed; dedupe products by `identifier`.

## Images

Shop logo or banner via IPFS.

## Special constraints

- Create `product` children before linking refs.
- Dedupe shop by merchant/brand when applicable.

## Verification

`resolve_object`: navigation refs resolve to `product` objects.

## Related workflows

- [product](product.md)
