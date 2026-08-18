---
title: Create map object
description: Agent playbook for ODL map — layers, geo filters, mapObjectsList refs.
type: skill
status: active
scope: platform
tags: [object-create, object-create-playbook, map, agent]
related:
  - docs/skills/object-content-standards.md
---

# Create map object

Map view with objects and layers.

## When to use / not

- **Use** for geo visualization of `place` / `restaurant` / other mappable types.
- Configure `mapObjectTypes`, `mapObjectTags`, `mapRectangles` before populating `mapObjectsList`.

## Product baseline fields

`name`, `description`, `image` (product policy).

## Field semantics

| Update | Semantics |
|--------|-----------|
| `mapObjectsList` | Object refs shown on map |
| `mapObjectTypes` | Filter allowed object types |
| `mapObjectTags` | Tag filters for discovery |
| `mapRectangles` | Bounding regions |
| `mapMobileView`, `mapDesktopView` | Viewport config JSON |

## Categories and tags (soft)

Not required — omit unless tagging the map itself.

## Locales

See [object content standards](../object-content-standards.md).

## Research and source hierarchy

- Child objects must have verified `geo` from authoritative sources.

## Images

Optional map thumbnail via IPFS.

## Special constraints

- Child objects need valid `geo` for map pins.
- `mapObjectsList` refs must exist on chain.

## Verification

`resolve_object`: map config fields + sample ref resolves.

## Related workflows

- [place](place.md) · [restaurant](restaurant.md)
