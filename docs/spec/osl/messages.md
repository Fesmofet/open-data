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
  - docs/spec/osl/notifications.md
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

Object channels may optionally include **`original_created_at_unix`** (integer unix seconds) — the original publish time for archival content (Instagram, Facebook, reviews). Display metadata only; does not affect feed sort. Ignored on DM/group channels. Invalid or out-of-range values are dropped at index time (message still inserted).

```json
{
  "channel_id": "obj-ch-product-1",
  "body": "https://instagram.com/p/…",
  "original_created_at_unix": 1262304000
}
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

## `message_update` (v1)

- **Author-only** full body replace on **plaintext** messages (`body` set, `encrypted_body` null).
- Payload: `{ channel_id, message_id, body }` — `body` length 1–65535; no `encrypted_body`.
- Sets `updated_at_unix` from block timestamp; does not change `created_at_unix`, `reply_to`, or `original_created_at_unix`.
- Warn-skipped when: tombstoned, missing, wrong channel, non-author, or encrypted row.

## Reply validation (`message_create`)

When `reply_to` is present, the indexer requires the parent message to exist in the **same channel** and not be tombstoned. Invalid `reply_to` → **entire create skipped** (no insert).

Optional `quote_json` snapshot (`{ author, body }`) is stored as-is for display when the parent is not loaded.

## Object channel plaintext

- **`message_create` on object channels:** plaintext (`body`) only; `encrypted_body` is warn-skipped by the indexer (see [channels.md](./channels.md)).

## `message_context_exclude`

- Author excludes own message from AI context (`for_context` queries).
- Message remains visible in normal history.

## Replay

- Tombstone PK prevents resurrecting deleted `message_id` on re-index.
