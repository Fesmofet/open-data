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
- Requires **one of** `body`, `overflow_ref`, or `encrypted_body` (+ `encryption`).

### Plaintext

```json
{ "channel_id": "dm-…", "body": "hello" }
```

### Encrypted

```json
{
  "channel_id": "grp-abc",
  "encrypted_body": "#5HQ7…",
  "encryption": { "v": 1, "mode": "memo", "to": "bob" }
}
```

| Field | Values |
|-------|--------|
| `encrypted_body` | `#` + base58 Hive memo ciphertext |
| `encryption.v` | `1` |
| `encryption.mode` | `memo` \| `ephemeral` |
| `encryption.to` | Hive account — intended recipient |

Reject (warn-only skip, no DB write):

- `body` and `encrypted_body` together
- `encrypted_body` without `encryption` (or reverse)
- Invalid ciphertext regex or unknown `mode`

See [encryption-future.md](./encryption-future.md) for UX and crypto semantics.

## `message_delete` (v1)

- **Author-only** — tombstone + hard delete from `messages`.
- No admin/creator/object-creator delete of others; use mute on read-path.

## `message_context_exclude`

- Author excludes own message from AI context (`for_context` queries).
- Message remains visible in normal history.

## Replay

- Tombstone PK prevents resurrecting deleted `message_id` on re-index.
