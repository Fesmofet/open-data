---
title: Create restaurant object
description: Agent playbook for ODL restaurant — hours, geo, address, menuItem navigation, tag categories.
type: skill
status: active
scope: platform
tags: [object-create, object-create-playbook, restaurant, agent]
related:
  - docs/skills/restaurant-menu-workflow.md
  - docs/skills/object-create/dish.md
  - docs/skills/object-create/drink.md
  - docs/skills/object-content-standards.md
---

# Create restaurant object

Restaurant or dining venue.

## When to use / not

- **Use** for a dining venue with address, hours, and menu navigation.
- **Not** for a single menu item — use `dish` / `drink` / `recipe`; set `parent` on the menu item to this restaurant's `object_id`.
- **Not** when venue already exists — update or link instead.

## Product baseline fields

`name`, `description`, `image` when supported (product policy).

## Field semantics

| Update | Semantics |
|--------|-----------|
| `workHours` | Structured hours from official source only |
| `address` | Street address; verify against maps/official site |
| `geo` | Coordinates matching address |
| `telephone`, `email`, `website` | Contact channels from official source |
| `menuItem` | **Navigation row** — `title` + `link_to_object` or `link_to_web`; not dish/drink payload |
| `price` | Average price indicator when known (not per-item; dishes/drinks carry their own `price`) |
| `listItem` | Direct ref to a child object, or to a [`list`](list.md) section that groups dishes/drinks |
| `parent` | Chain or group parent when applicable |

Menu items usually declare the restaurant on the **child** object: set `parent` on each [`dish`](dish.md) / [`drink`](drink.md) to this restaurant's `object_id`. Use `menuItem` / `listItem` on the restaurant for navigation and section layout.

## Categories and tags (soft)

**Discover tags** (`supposed_updates`):

- `Ambience`, `Service`, `Food`, `Value` — `aggregateRating` dimensions
- `Cuisine`, `Features`, `Good For` — `tagCategory` keys

Use canonical category names only.

## Locales

Translate `name`, `description`, `menuItem.title`, tag `value`. Keep `geo`, `telephone`, `website`, `link_to_object` unchanged across locales.

## Research and source hierarchy

1. Official restaurant website or Google Maps verified listing.
2. Delivery platforms (cross-check hours/address).
3. Omit unverified hours or phone — do not guess.

## Images

- Hero: exterior, interior, or logo from official source.
- Menu dish images belong on `dish`/`drink` objects, not duplicated on restaurant `image` unless brand shot.

## Special constraints

- **`menuItem` is not the dish/drink** — create `dish`/`drink` first with `parent` → this restaurant, then add navigation rows.
- See [restaurant menu workflow](../restaurant-menu-workflow.md) for full composite flow.
- Dedupe by name + address + website.

## Verification

`resolve_object`:

- `fields.name`, `fields.address`, `fields.workHours`, `fields.geo` when set
- `fields.menuItem` entries resolve to existing objects
- Sample menu `dish`/`drink` children have `fields.parent` pointing at this restaurant
- Contact fields match source

## Related workflows

- [Restaurant menu workflow](../restaurant-menu-workflow.md)
- [list](list.md) — menu sections (Appetizers, Drinks, …)
- [dish](dish.md) · [drink](drink.md) · [recipe](recipe.md)
