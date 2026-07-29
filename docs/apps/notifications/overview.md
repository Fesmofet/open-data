---
id: docs-apps-notifications-overview
title: notifications
type: overview
status: active
scope: notifications
tags: [notifications, overview]
updated_at: 2026-07-28
related:
  - docs/README.md
  - docs/apps/notifications/spec/transport.md
---

# notifications

## Purpose

NestJS service exposing a **native WebSocket** endpoint (`@nestjs/platform-ws`) for authenticated clients. Delivers real-time notifications (feed + live push) and supports `subscribe` by `trx_id` for transaction confirmation.

Events are consumed from a **Redis Stream** published by **chain-indexer** (`@opden-data-layer/notifications-contract` + Zod validation).

## Stack

- NestJS 11, JWT (`JWT_SECRET`, shared with auth tokens)
- Native `ws` ping/pong heartbeat
- Redis Stream consumer + per-user feed lists
- `user_notification_settings` gating with Redis settings cache

## Verification

```bash
pnpm nx build notifications
pnpm nx lint notifications
pnpm nx test notifications
pnpm nx serve notifications
```

WebSocket URL: `ws://<host>:<PORT>/notifications` (default port `7200`).

## Feature specs

| Topic | Doc |
|-------|-----|
| Event catalog | [event-catalog.md](spec/event-catalog.md) |
| Transport | [transport.md](spec/transport.md) |
| Routing | [routing.md](spec/routing.md) |
| Message builder | [message-builder.md](spec/message-builder.md) |
| Telegram channel | [telegram-channel.md](spec/telegram-channel.md) |
