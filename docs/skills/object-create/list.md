---
title: Create list object
description: Agent playbook for ODL list — curated grouped collections via listItem refs (menus, catalogs, sections).
type: playbook
status: active
scope: platform
tags: [object-create, object-create-playbook, list, agent]
related:
  - docs/skills/object-content-standards.md
  - docs/skills/restaurant-menu-workflow.md
  - docs/skills/object-create/restaurant.md
  - docs/skills/object-create/business.md
---

# Create list object

Curated, ordered collection of object refs. Use `list` when you need a **named group** of existing objects — menu section, product lineup, featured picks — without duplicating their fields.

## When to use / not

- **Use** to group related objects in display order (`listItem` refs).
- **Use** for menu sections (e.g. Appetizers, Mains, Drinks) that point at `dish` / `drink` objects.
- **Use** for business catalogs (e.g. Featured products) that point at `product` objects.
- **Use** when the parent (`restaurant`, `business`, `page`) should link to one object per section instead of many flat `menuItem` rows.
- **Not** when a full page layout or shop navigation tree is needed — consider `page` or `shop`.
- **Not** as a substitute for the target object — payload (`price`, `image`, …) stays on `dish`, `drink`, `product`, etc.

## Product baseline fields

`name`, `description`, `image` (product policy).

## Field semantics

| Update | Semantics |
|--------|-----------|
| `listItem` | Ordered object refs (`object_id` strings); one ref per row |
| `sortCustom` | Custom sort rules when applicable |
| `contentView` | List presentation mode |
| `parent` | Optional parent container |

Schema details: `get_update_schema({ update_type })`.

## Common grouping patterns

### Restaurant menu sections

1. Create each menu entry as [`dish`](dish.md) or [`drink`](drink.md) (name, price, image on the child).
2. Create one `list` per section — e.g. `restaurant-foo-appetizers`, `restaurant-foo-mains`.
3. Add `listItem` refs to the dish/drink objects in serving order.
4. Link the section from [`restaurant`](restaurant.md) via `menuItem` (`link_to_object` → list id) or `listItem`.

```text
restaurant
  └─ menuItem → list "Appetizers"
                    └─ listItem → dish-a
                    └─ listItem → dish-b
  └─ menuItem → list "Drinks"
                    └─ listItem → drink-a
```

See [restaurant menu workflow](../restaurant-menu-workflow.md).

### Business product lineup

1. Create each sellable item as [`product`](product.md).
2. Create a `list` — e.g. `acme-featured-products`, `acme-bestsellers`.
3. Add `listItem` refs to products in display order.
4. Link from [`business`](business.md) via `menuItem` or `listItem`.

```text
business
  └─ menuItem → list "Featured"
                    └─ listItem → product-a
                    └─ listItem → product-b
```

`list` vs flat `listItem` on the parent: use a dedicated `list` object when the group has its own title, cover image, or is reused from multiple parents.

## Categories and tags (soft)

No `supposed_updates` — omit tags or discover platform vocabulary.

## Locales

`listItem` refs are not localizable. Translate `name` and `description` on the list itself. Target objects keep their own locale rows.

See [object content standards](../object-content-standards.md).

## Research and source hierarchy

- Curate from existing on-chain objects; verify each ref before `listItem`.
- Section names and order should match the official menu or catalog when sourcing from a merchant site.

## Images

Optional cover image for the section (IPFS). Item images stay on referenced `dish`, `drink`, `product`, etc.

## Special constraints

- Referenced objects must exist before `listItem` broadcast.
- No duplicate refs in one payload.
- Do not embed price or description on the list — resolve targets for card fields.

## Verification

`resolve_object`:

- `fields.name` set
- each `listItem` resolves to an active object of the expected type
- parent `menuItem` / `listItem` points at this list when used as a section

## Related workflows

- [Restaurant menu workflow](../restaurant-menu-workflow.md)
- [restaurant](restaurant.md) · [dish](dish.md) · [drink](drink.md)
- [business](business.md) · [product](product.md)
- [Object content standards](../object-content-standards.md)
