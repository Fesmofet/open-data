---
id: docs-spec-osl-messages
title: OSL messages
description: Flat message sequence, deletion, AI context exclusion.
type: spec
status: active
scope: platform
tags: [osl, messaging]
related:
  - docs/spec/osl/channels.md
---

# OSL messages

## `message_create`

- Flat sequence per channel; optional `reply_to`, `quote_json`, `attachments`, `mentions`.
- `message_id` = `{transaction_id}-{trxIdx}-{opIdx}-{eventIndex}`.
- DM bootstrap: `peer` or `members` (exactly 2, includes signer); no `channel_id` in bootstrap payload.
- Requires `body` or `overflow_ref`.

## `message_delete` (v1)

- **Author-only** — tombstone + hard delete from `messages`.
- No admin/creator/object-creator delete of others; use mute on read-path.

## `message_context_exclude`

- Author excludes own message from AI context (`for_context` queries).
- Message remains visible in normal history.

## Replay

- Tombstone PK prevents resurrecting deleted `message_id` on re-index.
