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

Migration: `00052_osl_channels_messages.ts`

Tables: `channels`, `channel_members`, `channel_aliases`, `messages`, `message_tombstones`, `message_context_exclusions`.

Key indexes:

- `uq_channels_direct_pair_hash` on `pair_hash` where `kind=direct`
- `uq_channels_object_kind` on `object_id` where `kind=object`
- `idx_messages_channel_time` on `(channel_id, created_at_unix DESC, event_seq DESC)`

Messages are **not** stored in `object_updates`.
