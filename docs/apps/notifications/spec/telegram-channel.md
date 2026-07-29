---
id: docs-apps-notifications-spec-telegram-channel
title: Telegram notifications channel
description: Long-polling bot, subscriptions, and Redis stream outbound queue.
type: spec
status: active
scope: notifications
tags: [notifications, telegram]
updated_at: 2026-07-29
related:
  - docs/apps/notifications/spec/message-builder.md
  - docs/apps/notifications/spec/transport.md
---

# Telegram notifications channel

MVP delivery channel inside `apps/notifications`. English copy only (`en-dictionary.ts`); same message keys as web via `@opden-data-layer/notifications-messages`.

## Flow

1. `NotificationRouterService` enqueues after settings filter and Redis feed write.
2. `TelegramNotificationService` resolves `telegram_subscriptions` chat IDs, builds plain text with `renderPlainText`, `XADD` to `notifications:queue:telegram`.
3. `TelegramSenderService` consumes the stream (group `telegram-sender`), throttles, calls Bot API without `parse_mode`.
4. `TelegramPollerService` long-polls `getUpdates` (single active poller via Redis lock), handles `/start`, `/stop`, `/list`, and free-text Hive usernames.

## Database

Table `telegram_subscriptions` (`chat_id`, `account`, `created_at`), composite PK. See migration `00048_telegram_subscriptions`.

## Redis keys

| Key | Purpose |
|-----|---------|
| `notifications:queue:telegram` | Outbound stream |
| `notifications:lock:telegram-poller` | One poller per deployment |
| `notifications:cache:telegram:sent:{itemId}:{chatId}` | Send dedup (1h TTL) |

## Environment

| Variable | Required | Notes |
|----------|----------|-------|
| `TELEGRAM_BOT_TOKEN` | No | Omit to disable Telegram entirely |
| `TELEGRAM_BOT_USERNAME` | No | Default `WaivioNotificationsBot` |
| `WEB_PUBLIC_ORIGIN` | No | Default `http://localhost:3000`; used for absolute links in messages |
| `TELEGRAM_POLL_TIMEOUT_SEC` | No | Default `30` |
| `TELEGRAM_SEND_RATE_PER_SEC` | No | Default `25` |

## Bot commands

- `/start [username...]` — subscribe chat to Hive account(s)
- `/stop [username...]` — unsubscribe; no args removes all accounts for the chat
- `/list` — list subscribed accounts
- Plain text — treated as space/comma-separated Hive usernames (same as legacy UX)

Unknown Hive accounts are rejected with a short reply (no FK error).

## Errors

- HTTP 403 from Telegram — subscription row removed for that chat/account
- HTTP 429 — wait `retry_after`, do not ACK stream entry until sends succeed
