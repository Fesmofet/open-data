---
id: docs-apps-notifications-spec-telegram-channel
title: Telegram notifications channel
description: Long-polling bot, subscriptions, and Redis stream outbound queue.
type: spec
status: active
scope: notifications
tags: [notifications, telegram]
updated_at: 2026-07-30
related:
  - docs/apps/notifications/spec/message-builder.md
  - docs/apps/notifications/spec/transport.md
---

# Telegram notifications channel

MVP delivery channel inside `apps/notifications`. English copy only (`en-dictionary.ts`); same message **keys** as web via `@opden-data-layer/notifications-messages`, but Telegram templates use explicit Hive account names (`{recipient}`) instead of “you/your” because one chat may subscribe to multiple accounts.

## Flow

1. `NotificationRouterService` enqueues after settings filter and Redis feed write.
2. `TelegramNotificationService` resolves `telegram_subscriptions` chat IDs, builds the message body with `renderTelegramBody`, stores `websiteUrl` separately, and `XADD`s to `notifications:queue:telegram`.
3. `TelegramSenderService` consumes the stream (group `telegram-sender`), drains its own pending entries on startup (`XREADGROUP` id `0`), throttles, calls Bot API with inline keyboard markup (no raw URL in message text).
4. `TelegramPollerService` long-polls `getUpdates` (single active poller via Redis lock), dispatches command handling without blocking the next poll, and handles `/start`, `/stop`, `/list`, free-text Hive usernames, and `callback_query` unsubscribe buttons. `TELEGRAM_POLL_INTERVAL_MS` applies only after an empty poll cycle (no updates received).

## Outbound message format

- **Body:** English template from `renderTelegramBody` + `en-dictionary.ts` — **no** raw URL appended to the text. `TelegramNotificationService` injects `{recipient}` (the subscribed Hive account) at render time.
- **Inline keyboard:**
  - `Go to website` — URL button when `message.href` resolves to an absolute link via `WEB_PUBLIC_ORIGIN`
  - `Unsubscribe {account}` — `callback_data: unsubscribe:{account}`; handled by the poller (`answerCallbackQuery` + DB unsubscribe)
- Text commands `/stop` remain supported as a fallback.

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
| `TELEGRAM_BOT_TOKEN` | No | Omit to disable user Telegram bot |
| `WEB_PUBLIC_ORIGIN` | No | Default `http://localhost:3000`; absolute links in outbound messages |
| `TELEGRAM_POLL_TIMEOUT_SEC` | No | Default `10` (legacy long-poll timeout) |
| `TELEGRAM_POLL_INTERVAL_MS` | No | Default `300` — pause between empty `getUpdates` cycles only |
| `TELEGRAM_SEND_RATE_PER_SEC` | No | Default `25` |

Bot **username** for `https://t.me/...` links on the web UI is **`NOTIFICATIONS_TELEGRAM_BOT_USERNAME`** on `apps/web` only (not this service).

## Bot commands

- `/start [username...]` — subscribe chat to Hive account(s)
- `/stop [username...]` — unsubscribe; no args removes all accounts for the chat
- `/list` — show subscribed accounts with inline keyboard (profile link + Unsubscribe per row)
- Plain text — treated as space/comma-separated Hive usernames (same as legacy UX)

After a successful subscribe (or `/list`), the bot replies with **You are subscribed to:** and an inline keyboard: each row is `{account}` (URL to `WEB_PUBLIC_ORIGIN/@account`) and `Unsubscribe {account}`. Unsubscribe callback refreshes the same list message.

Each chat may follow at most **10** Hive accounts (`TELEGRAM_MAX_ACCOUNTS_PER_CHAT`). Re-subscribing to an account already on the list does not use an extra slot; additional usernames beyond the cap are rejected with a short message.

Unknown Hive accounts are rejected with a short reply (no FK error).

## Errors

- HTTP 403 from Telegram — subscription row removed for that chat/account
- HTTP 429 — wait `retry_after`, do not ACK stream entry until sends succeed
- Network / HTTP 5xx — do not ACK; entry stays in the consumer PEL and is retried (including on service restart via pending drain)
- `XLEN notifications:queue:telegram` does **not** shrink on ACK — use `XPENDING notifications:queue:telegram telegram-sender` to see stuck deliveries
