---
id: docs-apps-notifications-spec-telegram-ops-bot
title: Telegram ops bot
description: System alerts bot, subscribers table, and system-alerts Redis stream consumer.
type: spec
status: active
scope: notifications
tags: [notifications, telegram, ops]
updated_at: 2026-07-29
related:
  - docs/apps/scheduler/spec/system-health.md
  - docs/apps/notifications/spec/telegram-channel.md
  - docs/spec/system-alerts.md
---

# Telegram ops bot

Separate Bot API token from the **user notifications** bot. Delivers **system alerts** (indexer lag, future producer sources) to operator chats subscribed via `/start`.

## Flow

1. Producers (e.g. `apps/scheduler` `system-health-check` job) publish `SystemAlert` payloads to Redis stream `notifications:queue:system-alerts` via `@opden-data-layer/system-alerts` `SystemAlertPublisherService`.
2. `TelegramOpsSenderService` consumes the stream (group `system-alerts-ops`), validates with Zod, renders plain text, sends to all rows in `ops_telegram_subscribers`.
3. `TelegramOpsPollerService` long-polls with lock `notifications:lock:telegram-ops-poller` (independent from the user bot lock).

Do **not** send ops alerts through the user `notifications:queue:telegram` stream or `TelegramNotificationService`.

## Database

Table `ops_telegram_subscribers` (`chat_id` PK, `created_at`). Migration `00049_ops_telegram_subscribers`. No FK to Hive accounts.

## Redis keys

| Key | Purpose |
|-----|---------|
| `notifications:queue:system-alerts` | Inbound system alert stream |
| `notifications:lock:telegram-ops-poller` | One ops poller per deployment |
| `notifications:cache:telegram-ops:sent:{streamId}:{chatId}` | Send dedup (1h TTL) |

## Bot commands

- `/start` — subscribe chat to system alerts (upsert row)
- `/status` — live `SystemHealthCheckService.check()` (Hive + Hive Engine cursors vs chain head)
- `/help` — command list

## Environment

| Variable | Required | Notes |
|----------|----------|-------|
| `TELEGRAM_OPS_BOT_TOKEN` | No | Omit to disable ops poller and sender |
| `HIVE_ENGINE_NODES` | No | Comma-separated; defaults from `@opden-data-layer/clients`. **Required for process boot** (Hive Engine client is registered globally for `/status` even when ops token is unset). |
| `SYSTEM_HEALTH_BLOCK_LAG_BUFFER` | No | Default `100` blocks |

Hive RPC for `/status` uses built-in `HIVE_RPC_NODES` via `HiveClientModule` (`notifications:hive-rpc` cache prefix).

Only **bot tokens** belong in this service. Public `t.me` links use `NOTIFICATIONS_TELEGRAM_BOT_USERNAME` on `apps/web`.

## Errors

- HTTP 403 — remove subscriber row for that `chat_id`
- HTTP 429 — honor `retry_after`, do not ACK stream entry until sends complete

## Code layout

`apps/notifications/src/telegram-ops/`
