---
id: docs-skills-osl-messaging
title: OSL messaging for agents
description: Read, send, encrypt, and receive OSL channel messages via query-api MCP and agent-wallet.
type: skill
status: active
scope: platform
tags: [osl, messaging, agent-wallet, query-api, encryption, notifications]
updated_at: 2026-08-20
related:
  - docs/skills/hive-blockchain-broadcast.md
  - docs/skills/hive-has-agent-wallet.md
  - docs/skills/query-api-mcp-routing.md
  - docs/apps/query-api/spec/osl-messaging.md
  - docs/spec/osl/messages.md
  - docs/spec/osl/channels.md
  - docs/spec/osl/encryption-future.md
  - docs/spec/osl/agents.md
---

# OSL messaging for agents

Send and read **OSL channels and messages** (DM, group, object) using indexed query-api data and on-chain `message_create` / `channel_create` via **agent-wallet**.

## When to use

- Agent must **read** DM/group inbox or object channel history.
- Agent must **send** plaintext or encrypted messages on behalf of a Hive account.
- Agent should **react to inbound messages** via notifications push (not query-api polling).
- Hermes or other MCP agents need a documented loop: pull → read → decrypt → reply → broadcast.

## When not to use

- **ODL object_create / update_create** — [hive-blockchain-broadcast.md](hive-blockchain-broadcast.md).
- **OBL** offers, contracts, ledger — OBL skills + broadcast.
- Browser interactive messaging — web app Keychain flow ([messaging spec](../apps/web/spec/messaging.md)).
- Server-side decryption of message bodies — OSL never decrypts on chain or in query-api.

## Agent account model

See [agents.md](../spec/osl/agents.md):

| Channel kind | Use |
|--------------|-----|
| `direct` | 1:1 DM (`peer` bootstrap or existing `channel_id`) |
| `group` | Multi-party (`channel_create` with `kind: group`) |
| `object` | Object-tied public-read feed (`kind: object`) |

Object channels are **not** listed in the viewer inbox; use object routes.

## MCP servers

| Server | Role |
|--------|------|
| **query-api** `POST /query/mcp` | Read channels, messages, memo public keys |
| **agent-wallet** `POST /agent-wallet/mcp` | Build ops, memo encrypt/decrypt, broadcast, notifications bridge |
| **knowledge-api** | Specs (`docs/spec/osl/*`, query-api osl-messaging spec) |

## Inbound: notifications bridge (preferred)

Do **not** poll `get_channels` in a tight loop for new mail. Use agent-wallet:

1. `waivio_auth_start` + `waivio_auth_status` — WS requires JWT (`payload.sub` = Hive account).
2. Daemon connects to `NOTIFICATIONS_WS_URL` (default derived from `WAIVIO_API_ORIGIN` → `wss://<host>/notifications/ws`).
3. `notifications_pull({ limit?, waitMs?, types? })` drains buffered push events.
4. `notifications_status` — `{ connected, bufferedCount, lastEventAt, account }` (no tokens).

Event types:

| Type | Meaning |
|------|---------|
| `message_direct` | New DM for the agent account |
| `message_group` | New group channel message |
| `bell_object_message` | New message on an object the user follows with bell |

Payloads **never** include message body or ciphertext — always follow with `get_channel_messages` / `get_object_channel_messages`.

## Read (query-api MCP)

| Tool | Purpose |
|------|---------|
| `get_channels` | Viewer inbox (`viewer` required; optional `kind`, `cursor`) |
| `get_channel_by_id` | Channel detail + membership |
| `get_channel_by_alias` | Resolve `dm:` / `obj:` aliases |
| `get_channel_messages` | History for a channel (`channel_id`, optional `for_context`) |
| `get_object_channel` | Object default channel meta |
| `get_object_channel_messages` | Public object feed (governance + mute filters) |
| `get_memo_public_key` | Recipient memo public key before encrypt |

HTTP parity: [osl-messaging API](../apps/query-api/spec/osl-messaging.md).

List agent groups: `get_channels({ viewer: "<agent>", kind: "group" })`.

## Write (agent-wallet MCP)

### Plaintext

Works with **HAS** (`has_broadcast`) or **local keys** (`wallet_broadcast`):

1. `osl_build_message_create({ creator, channelId | peer, body })` → `{ ops, opsCount, bytes }`
2. `wallet_broadcast` or `has_broadcast` → poll status
3. Confirm via `notifications_pull` or `get_channel_messages`

DM bootstrap: omit `channel_id`, pass `peer` — indexer creates the DM channel.

### Encrypted (local memo only)

**Requires** `AGENT_WALLET_SIGNING_MODE=local`, `HIVE_MEMO_KEY` matching on-chain `memo_key`, and `wallet_status.memoReady === true`.

HAS cannot sign memo operations — do not use `has_broadcast` for encrypted sends.

1. `get_memo_public_key({ account: recipient })` (query-api) or dhive in daemon
2. `osl_build_encrypted_message_create({ creator, channelId | peer, recipient, plaintext, mode: "memo" | "ephemeral" })`
   - `memo` — bidirectional (sender can decrypt own messages)
   - `ephemeral` — one-way to recipient (sender cannot decrypt)
3. `wallet_broadcast({ ops, keyType: "posting" })`

Inspect ciphertext only: `osl_memo_encrypt` / `osl_memo_decrypt`.

### New channels

`osl_build_channel_create({ kind: "group" | "object", creator, members?, objectId?, title? })` then broadcast.

Payload builders live in `@opden-data-layer/hive-broadcast` (`buildGroupChannelCreatePayload`, etc.).

## Environment (agent-wallet)

| Variable | Purpose |
|----------|---------|
| `HIVE_ACCOUNT` | Agent Hive account |
| `HIVE_POSTING_KEY` | Local signing (local mode) |
| `HIVE_MEMO_KEY` | Memo encrypt/decrypt (optional until encrypted messaging) |
| `AGENT_WALLET_SIGNING_MODE` | `has` (plaintext) or `local` (plaintext + encrypted) |
| `ODL_NETWORK` | `testnet` / `mainnet` → custom_json id |
| `NOTIFICATIONS_WS_URL` | Override WS URL (default from `WAIVIO_API_ORIGIN`) |
| `WAIVIO_API_ORIGIN` | Auth + default notifications WS host |

## Encrypt / decrypt flow

```mermaid
sequenceDiagram
  participant Agent
  participant Query as query-api MCP
  participant Wallet as agent-wallet MCP
  participant Chain as Hive OSL

  Agent->>Query: get_memo_public_key(recipient)
  Agent->>Wallet: osl_build_encrypted_message_create(...)
  Agent->>Wallet: wallet_broadcast(ops)
  Chain-->>Wallet: indexed message
  Agent->>Query: get_channel_messages(channel_id)
  Agent->>Wallet: osl_memo_decrypt(ciphertext)
```

Decrypt when `encryption.to === agent` or (`encryption.mode === "memo"` and `author === agent`). Ephemeral sender never decrypts.

Details: [encryption-future.md](../spec/osl/encryption-future.md).

## Agent checklist

1. `wallet_status` — signing mode, memoReady, Waivio auth
2. `notifications_pull({ waitMs: 30000 })` when waiting for inbound
3. `get_channel_messages` / `get_object_channel_messages` for bodies
4. `osl_memo_decrypt` when `encrypted_body` present and viewer may decrypt
5. `osl_build_message_create` or `osl_build_encrypted_message_create`
6. `wallet_broadcast` / `has_broadcast` after user/policy approval
7. Poll broadcast status; optionally `notifications_pull` for delivery hint

## Hermes integration (optional)

Configure agent-wallet MCP with tool filter:

```yaml
mcp_servers:
  odl_agent_wallet:
    url: "http://127.0.0.1:7500/agent-wallet/mcp"
    headers:
      Authorization: "Bearer <~/.odl/agent-wallet.token>"
    tools:
      include:
        - notifications_pull
        - notifications_status
        - osl_build_message_create
        - osl_build_encrypted_message_create
        - osl_memo_decrypt
        - wallet_broadcast
        - wallet_broadcast_status
        - wallet_status
```

Cron every 30–60s: `notifications_pull({ waitMs: 5000 })`; spawn conversation only when items non-empty.

## Related

- [Hive blockchain broadcast](hive-blockchain-broadcast.md) — OSL envelope ops
- [HAS agent wallet](hive-has-agent-wallet.md) — daemon setup
- [Query API MCP routing](query-api-mcp-routing.md) — live read tools
- [OSL messages spec](../spec/osl/messages.md) — on-chain payload reference
