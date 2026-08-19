---
id: docs-spec-osl-channels
title: OSL channels
description: Channel kinds, membership, aliases, canonical DM, object channel policy.
type: spec
status: active
scope: platform
tags: [osl, messaging]
related:
  - docs/spec/osl/messages.md
  - docs/apps/chain-indexer/spec/osl-parser.md
---

# OSL channels

**Back:** [OSL parser](../../apps/chain-indexer/spec/osl-parser.md)

## Kinds (v1)

| Kind | Create | Write | Read (query-api) |
|------|--------|-------|----------------|
| `direct` | Auto on first `message_create` only | Members only | Members only |
| `group` | `channel_create` | Members only | Members only |
| `object` | `channel_create` | **Any account** | **Public** (`public_read`) |

No `kind=agent` — see [agents.md](agents.md).

## Canonical DM

- `pair_hash` = SHA-256 hex of sorted lowercase members joined by `:`.
- `channel_id` = `dm-{pair_hash}` (deterministic; client cannot choose).
- `channel_create` with `kind=direct` is **rejected**.
- Alias `dm:{pair_hash}` created atomically with channel.

## Object channel

- One channel per `object_id` (unique index).
- Default `access=public_read`.
- Alias `obj:{object_id}` on create.
- Indexer does **not** filter `banned`/`muted` on write; query-api applies mute filters on read.

## Group membership

- Creator is `admin`; `channel_member_add`/`remove` require admin.
- Cannot remove last admin; cannot remove self as sole admin.
- DM members are immutable (exactly two `member` rows).

## Actions

| Action | Notes |
|--------|-------|
| `channel_create` | `group` or `object` only |
| `channel_alias_register` | Secondary aliases; canonical aliases auto-created |
| `channel_member_add` / `remove` | Group admin only |
| `channel_update` | Group admin; `title` / `image` only |

Reject handling: **warn-only** v1 (no persisted reject row).
