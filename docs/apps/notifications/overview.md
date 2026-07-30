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
- Redis Stream consumer + per-user feed lists (`NOTIFICATIONS_CONSUMER_NAME`, default `notifications-1`)
- Batch routing: settings, known accounts and Telegram subscriptions are read from Postgres in bulk once per stream batch (no caches) — see [transport spec](spec/transport.md)
- Gating applies to registered ODL accounts only; accounts without a `user_notification_settings` row fall back to `DEFAULT_NOTIFICATION_SETTINGS`
- Optional Telegram bots (user + ops): **tokens only** in this app (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_OPS_BOT_TOKEN`). Bot usernames for the web UI live on `apps/web` (`NOTIFICATIONS_TELEGRAM_BOT_USERNAME`).
- Hive + Hive Engine RPC clients (defaults from `@opden-data-layer/clients`) for ops `/status` and health checks; `HIVE_ENGINE_NODES` optional override.

## Verification

```bash
pnpm nx build notifications
pnpm nx lint notifications
pnpm nx test notifications
pnpm nx serve notifications
```

WebSocket URL: `ws://<host>:<PORT>/notifications/ws` (default port `7200`). HTTP pages `/notifications` are served by `apps/web`.

## Feature specs

| Topic | Doc |
|-------|-----|
| Event catalog | [event-catalog.md](spec/event-catalog.md) |
| Transport | [transport.md](spec/transport.md) |
| Routing | [routing.md](spec/routing.md) |
| Message builder | [message-builder.md](spec/message-builder.md) |
| Telegram channel | [telegram-channel.md](spec/telegram-channel.md) |
| Telegram ops bot | [telegram-ops-bot.md](spec/telegram-ops-bot.md) |
