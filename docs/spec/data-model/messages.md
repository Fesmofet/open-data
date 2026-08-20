---
id: docs-spec-data-model-messages
title: Messaging tables
description: OSL channels and messages DDL sketch.
type: spec
status: active
scope: platform
tags: [data-model, messaging]
related:
  - docs/spec/osl/channels.md
---

# Messaging data model

Migration: `00052_osl_channels_messages.ts`, encryption columns: `00055_osl_messages_encryption.ts`

Tables: `channels`, `channel_members`, `channel_aliases`, `messages`, `message_tombstones`, `message_context_exclusions`.

## `messages` encryption columns (v1)

| Column | Plain | Encrypted |
|--------|-------|-----------|
| `body` | plaintext | `NULL` |
| `encrypted_body` | `NULL` | `#…` ciphertext |
| `encryption_mode` | `NULL` | `memo` \| `ephemeral` |
| `encrypted_to` | `NULL` | recipient account |
| `encryption_v` | `NULL` | `1` |
| `encryption_meta` | `NULL` | `NULL` (multi-recipient v2) |

CHECK constraints:

- At least one of `body`, `overflow_ref`, `encrypted_body`
- `body` XOR `encrypted_body`
- Encryption metadata all-null or all-set

Partial index: `idx_messages_encrypted_to` on `(encrypted_to, created_at_unix DESC)` where `encrypted_to IS NOT NULL`.

Key indexes:

- `uq_channels_direct_pair_hash` on `pair_hash` where `kind=direct`
- `uq_channels_object_kind` on `object_id` where `kind=object`
- `idx_messages_channel_time` on `(channel_id, created_at_unix DESC, event_seq DESC)`

Messages are **not** stored in `object_updates`.
