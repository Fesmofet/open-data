---
title: Object create (ODL)
description: Agent skill for creating ODL objects — playbook lookup, schema, build, and broadcast workflow.
type: skill
status: active
scope: platform
tags: [object-create, agent, odl]
related:
  - docs/skills/object-content-routing.md
  - docs/skills/object-content-standards.md
  - docs/skills/hive-blockchain-broadcast.md
  - docs/skills/hive-has-agent-wallet.md
---

# Object create (ODL)

Workflow for creating a new ODL object on chain. Per-object-type field guidance lives in **playbooks** under `docs/skills/object-create/` — not separate skills.

## When to use

- User asks to create a recipe, restaurant, product, or any registered ODL object type.
- You need field semantics, categories, images, or verification steps before broadcast.

## When not to use

- Object already exists — use `odl_build_update_create` or `odl_build_gallery_item` instead.
- You only need JSON Schema — call `get_object_type` / `get_update_schema` directly.

## Workflow

1. **`get_object_create_playbook({ object_type })`** — registry baseline, required updates, and playbook excerpt for that type.
2. **`get_object_type({ object_type })`** — chain JSON Schema for `object_create` payload.
3. **`get_update_schema({ update_type })`** — per-field value shapes when building `fields[]`.
4. Build ops via **agent-wallet MCP**:
   - New object → `odl_build_object_create`
   - Existing object, one field → `odl_build_update_create`
   - Gallery photo → `odl_build_gallery_item`
5. **`wallet_broadcast({ ops, keyType: "posting", account? })`** (or `has_broadcast` in HAS mode).
6. Confirm via query-api `resolve_object`.

## Per-type playbooks

27 playbooks at `docs/skills/object-create/<objectType>.md` (e.g. `recipe`, `restaurant`, `dish`). Reach them via:

- `get_object_create_playbook({ object_type: "recipe" })`
- `list_files({ type: "playbook", tags: ["object-create-playbook"] })`

Do **not** expect them in `list_files({ type: "skill" })` — they are typed `playbook`, not `skill`.

## Related

- [object-content-routing.md](object-content-routing.md) — intent → playbook / workflow
- [object-content-standards.md](object-content-standards.md) — dedupe, locales, images
- [hive-has-agent-wallet.md](hive-has-agent-wallet.md) — agent-wallet MCP setup
