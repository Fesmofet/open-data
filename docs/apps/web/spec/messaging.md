---
id: docs-apps-web-spec-messaging
title: Web messaging UI
description: Profile inbox and object channel chat in apps/web.
type: spec
status: active
scope: web
tags: [web, messaging]
related:
  - docs/apps/query-api/spec/osl-messaging.md
  - docs/spec/osl/channels.md
---

# Web messaging UI

## Surfaces

| Surface | Route / tab | Data |
|---------|-------------|------|
| Profile inbox | `/@viewer/messages` (Posts submenu, after Threads) | Viewer DM + group channels |
| Object channel | `/object/:id/messages` | Single object channel |

Other users' profiles hide the Messages tab. Direct URL to another user's messages redirects to the viewer's inbox.

## Layout

Profile inbox uses three columns on desktop: channel list (left rail), chat (center), About (right rail). Object Messages uses center chat only at `/object/:id/messages`. All messaging shells share `MESSAGING_VIEWPORT_SHELL_CLASS` with internal scroll in list/message panels.

Outgoing message bubbles use `bg-accent-soft` + `text-fg` (see [theme.md](./theme.md)).

## API mapping

| UI action | query-api |
|-----------|-----------|
| Channel list | `GET /query/v1/channels` + `X-Viewer` |
| Channel detail | `GET /query/v1/channels/{id}` |
| Message history | `POST /query/v1/channels/{id}/messages` |
| Mark read | `POST /query/v1/channels/{id}/read` |
| Object channel | `GET /query/v1/objects/{object_id}/channel` |
| Object messages | `POST /query/v1/objects/{object_id}/channel/messages` |

## Send flow

Client builds `message_create` via `@opden-data-layer/hive-broadcast` (`buildOslMessageCreateOp`), broadcasts with wallet, awaits trx confirmation, revalidates cache tags.

- Existing channel: `{ channel_id, body }`
- New DM: `{ peer, body }`

## Group chat (profile New message)

| Selection | Action |
|-----------|--------|
| 1 user | Navigate `?peer=`; first message uses DM bootstrap (`message_create` with `peer`) |
| 2+ users | Broadcast `channel_create { kind: "group", channel_id, title?, members[] }` (viewer excluded from `members`; creator added on-chain), then navigate `?channel=`; first message is a separate `message_create` |

Optional group title is shown when two or more users are selected. `channel_id` is client-chosen (`grp-{uuid}`).

## Object channel bootstrap

Object Messages always renders the chat UI (compose + message list), even when query-api has no channel yet.

Per [channels.md](../../../spec/osl/channels.md), object channels require explicit `channel_create` before `message_create`. The UI uses deterministic `buildObjectChannelId(objectId)` → `obj-ch-{objectId}` for the pending channel.

| State | First send |
|-------|------------|
| No channel in DB | Single Hive trx: `channel_create { kind: "object", channel_id, object_id, title? }` + `message_create { channel_id, body }` |
| Channel exists | `message_create` only |

## Unread (v1)

Server-side `channel_members.last_read_at_unix`. List shows `unread_count`; All/Unread tabs filter client-side. Opening a channel calls mark-read with latest message timestamp.

## Out of scope (v1)

- WebSocket / live updates
- Attachments, emoji, delete UI
- Pinned messages (empty About section)
- Global nav unread badge
- DM encryption
