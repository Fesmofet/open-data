---
title: Create person object
description: Agent playbook for ODL person object_create and updates.
type: playbook
status: active
scope: platform
tags: [object-create, object-create-playbook, person, agent]
related:
  - docs/skills/object-content-standards.md
  - docs/skills/object-content-routing.md
---

# Create person object

Person or user profile.

## When to use / not

- **Use** when creating a new `person` on chain via `odl_build_object_create`.
- **Use** `odl_build_update_create` when the object already exists.
- **Not** for read-only queries — use query-api MCP.

## Product baseline fields

Call `get_object_create_playbook({ object_type: "person" })` for `required_updates` (product policy). Common baseline: `name`, `description`, `image` when supported — not a chain requirement.

## Field semantics

Supported updates (registry): status, image, name, title, imageBackground, parent, tagCategory, tagCategoryItem, ….

Use `get_update_schema({ update_type })` for `value_kind`, `cardinality`, and `localizable`.

## Categories and tags (soft)

Registry `supposed_updates`:

- `tagCategory`: "Education", "Occupation", "Interests"

See [object content standards](../object-content-standards.md) for shop `category` vs discover tags.

## Locales

See [object content standards](../object-content-standards.md).

## Research and source hierarchy

- Prefer official or authoritative sources for factual fields.
- Omit unknown facts; do not invent prices, hours, or claims.
- Mark generated marketing copy as generated.

## Images

Follow [object content standards](../object-content-standards.md): stable source or generated → IPFS before broadcast. Create `imageGallery` before `imageGalleryItem` in initial create when using a gallery.

## Special constraints

- Dedupe before create (search / `resolve_object`).
- Web-compatible `object_id` when product URLs matter.
- No duplicate object/user refs in one payload.
- Link from [`book`](book.md) via `author` when this person wrote one or more publications.

## Verification

After broadcast, `resolve_object` and confirm:

- `object_type` = `person`
- `fields.name`, `fields.description`, `fields.image` when in product baseline
- Type-specific fields you set

## Related workflows

- [book](book.md) — link as `author` ref
- [Object content standards](../object-content-standards.md)
- [Object content routing](../object-content-routing.md)
- [Hive blockchain broadcast](../hive-blockchain-broadcast.md)
