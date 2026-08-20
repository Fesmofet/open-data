---
id: docs-spec-osl-notifications
title: OSL messaging notifications
description: Notification types, recipients, and settings for OSL message_create events.
type: spec
status: active
scope: platform
tags: [osl, messaging, notifications]
related:
  - docs/spec/osl/messages.md
  - docs/apps/notifications/spec/event-catalog.md
  - docs/apps/notifications/spec/routing.md
---

# OSL messaging notifications

Produced by **chain-indexer** `MessageCreateHandler` after a successful `message_create` write. One notification per message (no coalescing).

## Event types

| Type | Channel kind | `objectId` | Payload |
|------|--------------|------------|---------|
| `message_direct` | `direct` | `null` | `channelId`, `messageId`, `author`, `encrypted` |
| `message_group` | `group` | `null` | above + `channelTitle` (nullable; copy falls back to `channelId`) |
| `bell_object_message` | `object` | object id | `channelId`, `messageId`, `author`, `encrypted`; adapter may add `objectName` |

- `actor` = message author in all cases.
- **Never** include message body or ciphertext in the notification payload.
- Skip emit when `channels.dissolved_at_unix` is set.

## Recipients

| Type | Recipients |
|------|------------|
| `message_direct` | `channel_members` minus author |
| `message_group` | `channel_members` minus author |
| `bell_object_message` | `user_object_follows.bell = true` for the object minus author |

Object channels have no membership roster for notifications — only object bell subscribers (same model as `bell_object_post`).

Encrypted group messages may address one participant (`encryption.to`); all channel members still receive the notification, but only the addressee can decrypt.

## Settings gating

| Column | Types |
|--------|-------|
| `messages` | `message_direct`, `message_group` |
| *(none)* | `bell_object_message` — ungated like `bell_post`; controlled only by object bell subscription |

Default: `messages = true` (`00056_user_notification_settings_messages`).

## Verification

```bash
pnpm nx test chain-indexer --testPathPatterns=message-create
pnpm nx test notifications --testPathPatterns=channel-messaging
pnpm nx test notifications-messages --testPathPatterns=messaging
```
