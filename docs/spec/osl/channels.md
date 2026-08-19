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
- Indexer does **not** filter `banned`/`muted` on write for object channels; query-api applies mute filters on read.

## Group membership limits and mute rules (v1)

- Maximum **100** members per active group channel (creator included).
- `channel_create.members` accepts at most **99** invitees (creator added as admin separately).
- **`channel_member_add`** and group **`channel_create`** enforce bidirectional social mutes and platform governance `muted` list on write (warn-skip):
  - Target muted adder → skip
  - Adder muted target → skip
  - Target or adder on platform governance `muted` → skip
- query-api exposes preflight: `POST /query/v1/channels/{id}/validate-members` and `POST /query/v1/channels/validate-invitees` (new group).

## Group membership

- Creator is `admin`; `channel_member_add`/`remove` require admin.
- Cannot remove last admin; cannot remove self as sole admin.
- Any member may self-leave via `channel_leave` (see below).
- DM members are immutable (exactly two `member` rows).

## `channel_leave` (v1)

Self-service leave for group members. Payload:

```json
{
  "channel_id": "grp-…",
  "successor_admin": "bob",
  "delete_my_messages": false
}
```

- `successor_admin` required when signer is the sole admin and 2+ members remain.
- When the last member leaves, channel is **dissolved** (`dissolved_at_unix` set); dissolved channels are excluded from viewer lists.
- `delete_my_messages: true` bulk-deletes signer messages (hard delete + tombstones) in the same indexer transaction.

## Actions

| Action | Notes |
|--------|-------|
| `channel_create` | `group` or `object` only |
| `channel_alias_register` | Secondary aliases; canonical aliases auto-created |
| `channel_member_add` / `remove` | Group admin only (kick) |
| `channel_leave` | Group member self-leave |
| `channel_update` | Group admin; `title` / `image` only |

Reject handling: **warn-only** v1 (no persisted reject row).
