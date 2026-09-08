---
title: Create drink object
description: Agent playbook for ODL drink — menu pricing, presentation, restaurant menu context.
type: playbook
status: active
scope: platform
tags: [object-create, object-create-playbook, drink, agent]
related:
  - docs/skills/restaurant-menu-workflow.md
  - docs/skills/object-create/restaurant.md
  - docs/skills/object-content-standards.md
---

# Create drink object

Drink or beverage with variants and details.

## When to use / not

- **Use** for a restaurant or bar menu beverage with price and short description.
- Set `parent` to the [`restaurant`](restaurant.md) `object_id` when the drink belongs to a venue.
- **Not** for read-only queries — use query-api MCP.

## Product baseline fields

`name`, `description`, `image` (from `get_object_create_playbook.required_updates`).

## Field semantics

| Update | Semantics |
|--------|-----------|
| `name` | Drink name as shown on menu |
| `description` | Short description (not recipe steps) |
| `price` | Menu price from official source |
| `parent` | Object ref to owning [`restaurant`](restaurant.md) — usual way to link a drink to a venue |
| `aggregateRating` | `Presentation`, `Taste`, `Value` dimensions when reviews exist |

Schema details: `get_update_schema({ update_type })`.

## Categories and tags (soft)

**Discover tags** (`supposed_updates`):

- `aggregateRating`: `Presentation`, `Taste`, `Value`
- `tagCategory`: `Category`, `Ingredients`

## Locales

Translate `name`, `description`, tag `value`. Keep `price` numeric/format consistent; clarify currency in description if needed.

## Research and source hierarchy

1. Official menu (PDF, website, in-venue photo).
2. Delivery app menu (cross-check price).
3. Do not invent ingredients or allergens — omit when unknown.

## Images

- Square beverage shot, white background, full glass/bottle visible.
- Match restaurant menu photo when available.

## Special constraints

- Dedupe before create (same name + restaurant).
- Set `parent` on the drink to the restaurant `object_id` when the item belongs to that venue.
- Add `menuItem` / `listItem` on the restaurant for menu navigation (payload stays on the drink).

## Verification

`resolve_object`:

- `fields.name`, `fields.price`, `fields.image` when set
- `fields.parent` resolves to the restaurant when set

## Related workflows

- [Restaurant menu workflow](../restaurant-menu-workflow.md)
- [restaurant](restaurant.md) · [dish](dish.md)
