---
title: Create service_requested object
description: Agent playbook for ODL service_requested — OBL catalog request fields budget, capability, SLA.
type: skill
status: active
scope: platform
tags: [object-create, object-create-playbook, service_requested, agent, obl]
related:
  - docs/skills/obl-offers-contracts.md
  - docs/skills/object-content-standards.md
---

# Create service_requested object

Agent-oriented service request for OBL catalog discovery.

## When to use / not

- **Use** when publishing an OBL-discoverable service **request** (buyer side).
- Pair with `service_offered` matching via `capability` / `priceModel`.

## Product baseline fields

`name`, `description`, `image` when used (product policy).

## Field semantics

| Update | Semantics |
|--------|-----------|
| `capability` | Required capability id for matching |
| `priceModel` | Expected pricing model |
| `currency` | Budget currency |
| `budget` | Budget range or max |
| `sla` | Required SLA constraints |

## Categories and tags (soft)

- `Category` tag key from `supposed_updates`

## Locales

Translate `name`, `description`. Keep `capability`, `budget`, `currency` structural.

## Research and source hierarchy

- Requester-provided requirements only.

## Images

Optional; often omitted for requests.

## Special constraints

- See [OBL offers and contracts](../obl-offers-contracts.md).

## Verification

`resolve_object`: `fields.capability`, `fields.budget` or `fields.priceModel` as specified.

## Related workflows

- [service_offered](service_offered.md)
- [OBL offers and contracts](../obl-offers-contracts.md)
