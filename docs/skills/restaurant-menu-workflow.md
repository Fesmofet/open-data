---
title: Restaurant menu workflow
description: Composite workflow — restaurant object, dishes/drinks, menu navigation, images, and dedupe.
type: skill
status: active
scope: platform
tags: [object-create, restaurant, menu, workflow, agent]
related:
  - docs/skills/object-create/restaurant.md
  - docs/skills/object-create/dish.md
  - docs/skills/object-create/drink.md
  - docs/skills/object-content-standards.md
  - docs/skills/object-content-routing.md
---

# Restaurant menu workflow

End-to-end workflow for a restaurant with menu items. Read [object content standards](object-content-standards.md) first.

## Concepts

- **`parent`** — usual ownership link from a menu item to its venue. Set `parent` on each `dish` / `drink` (or `recipe`) to the restaurant `object_id`.
- **`menuItem`** — navigation row linking to another object or web URL. It is **not** the dish payload (name/price/image live on the target object).
- **Dishes/drinks** — create as `dish` or `drink` (or `recipe` when full recipe content exists), with `price`, `description`, `image`, and `parent` → restaurant. Add `menuItem` / [`list`](object-create/list.md) on the restaurant for menu navigation.

```text
restaurant-foo
  └─ menuItem → dish-burger
dish-burger
  └─ parent → restaurant-foo
```

## Steps

1. **Dedupe restaurant** — search by name + address/website; skip create if match exists.
2. **`get_object_create_playbook({ object_type: "restaurant" })`** — workHours, geo, address, tag categories.
3. **Create restaurant** — baseline fields + factual hours/address from source only.
4. **Per menu entry** (dedupe each):
   - Search for existing `dish`/`drink`/`recipe`.
   - Create child object with `price`, `description`, `image` (IPFS), and **`parent`** set to the restaurant `object_id`.
   - Add `menuItem` on restaurant pointing to child `link_to_object` (translate `title` per locale rules; keep refs unchanged). Optional: group sections via [`list`](object-create/list.md).
5. **Broadcast in small batches** — restaurant first, then children (`parent` included), then `menuItem` updates if needed.
6. **Verify** — `resolve_object` on restaurant and sample menu items; check `fields.menuItem`, `fields.workHours`, `fields.geo`, and `fields.parent` on children → restaurant.

## Images

- Restaurant: exterior or logo when available; dish images per type playbook (square, white background for food).
- No transient CDN URLs — IPFS before broadcast.

## Related playbooks

- [restaurant](object-create/restaurant.md)
- [dish](object-create/dish.md)
- [drink](object-create/drink.md)
- [list](object-create/list.md) — menu sections
- [recipe](object-create/recipe.md) — when recipe-style content is required
