---
title: Create dish object
description: Agent playbook for ODL dish — menu pricing, presentation, restaurant menu context.
type: skill
status: active
scope: platform
tags: [object-create, object-create-playbook, dish, agent]
related:
  - docs/skills/restaurant-menu-workflow.md
  - docs/skills/object-create/restaurant.md
  - docs/skills/object-content-standards.md
---

# Create dish object

Dish or menu item with pricing and options.

## When to use / not

- **Use** for a restaurant menu item with price and short description.
- **Use** `recipe` when full ingredients, cook time, and nutrition are required.
- Set `parent` to the [`restaurant`](restaurant.md) `object_id` when the dish belongs to a venue.

## Product baseline fields

`name`, `description`, `image` (product policy).

## Field semantics

| Update | Semantics |
|--------|-----------|
| `name` | Menu item name as shown on menu |
| `description` | Short dish description (not recipe steps) |
| `price` | Menu price from official source; include currency context when ambiguous |
| `parent` | Object ref to owning [`restaurant`](restaurant.md) — usual way to link a dish to a venue |
| `aggregateRating` | `Presentation`, `Taste`, `Value` dimensions when reviews exist |

## Categories and tags (soft)

- `Ingredients`, `Category` — tag category keys from `supposed_updates`
- Shop `category` not supported on `dish` — use tags only

## Locales

Translate `name`, `description`, tag `value`. Keep `price` numeric/format consistent; clarify currency in description if needed.

## Research and source hierarchy

1. Official menu (PDF, website, in-venue photo).
2. Delivery app menu (cross-check price).
3. Do not invent allergens or ingredients — omit or link to `recipe`.

## Images

- Square food shot, white background, full plate visible.
- Match restaurant menu photo when available; otherwise generate per recipe image brief.

## Special constraints

- Dedupe before create (same name + restaurant).
- Set `parent` on the dish to the restaurant `object_id` when the item belongs to that venue.
- Add `menuItem` / `listItem` on the restaurant for menu navigation (payload stays on the dish).

## Verification

`resolve_object`:

- `fields.name`, `fields.price`, `fields.image`
- `fields.parent` resolves to the restaurant when set
- Restaurant `menuItem.link_to_object` resolves to this id when used for navigation

## Related workflows

- [Restaurant menu workflow](../restaurant-menu-workflow.md)
- [restaurant](restaurant.md) · [recipe](recipe.md)
