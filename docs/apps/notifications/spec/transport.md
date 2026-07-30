---
id: docs-apps-notifications-spec-transport
title: Notifications transport
description: Cross-service events flow from **chain-indexer** to **notifications** via a Redis Stream. The JSON contract is defined in `@opden-data-layer/notifications-contract`.
type: spec
status: active
scope: notifications
tags: [notifications, transport]
updated_at: 2026-07-30
related:
  - docs/apps/notifications/overview.md
  - docs/apps/notifications/spec/event-catalog.md
---

# Notifications transport

Cross-service events flow from **chain-indexer** to **notifications** via a Redis Stream. The JSON contract is defined in `@opden-data-layer/notifications-contract` and validated with `notificationEventSchema` in the consumer.

## Redis keys

| Key | Type | Producer | Consumer |
|-----|------|----------|----------|
| `chain-indexer:notifications:stream` | Stream | chain-indexer (`XADD`) | notifications (`XREADGROUP` / `XACK`) |
| `notifications:cache:feed:{username}` | List | notifications (`LPUSH` + `LTRIM` + `EXPIRE`) | notifications (`LRANGE`) + WS live push |
| `notifications:queue:telegram` | Stream | notifications (`XADD`) | notifications Telegram sender |

Settings and Telegram subscriptions are **not cached** — they are read from Postgres in bulk once per stream batch, so there is no cache to invalidate.

Legacy feed key `notifications:list:{username}` is still read during rollout and merged with the new key.

Consumer group: `notifications-consumers`. Stable consumer name: `NOTIFICATIONS_CONSUMER_NAME` (default `notifications-1`).

## Audience gating

A recipient receives a notification only when it is a **registered ODL account**, which mirrors the legacy lookup against the Waivio `users` collection:

- has a `user_notification_settings` row — that row is used, or
- has a `user_metadata` row, or an active `telegram_subscriptions` row — `DEFAULT_NOTIFICATION_SETTINGS` applies.

Any other account (an arbitrary Hive account seen in the firehose) is dropped before any further I/O. `DEFAULT_NOTIFICATION_SETTINGS` in `apps/notifications/src/constants/notification-settings.constants.ts` mirrors the column defaults of `user_notification_settings`.

## Stream consumer throughput

The consumer processes a whole `XREADGROUP` batch as one unit, the way the legacy service processed a whole block:

1. Parse every entry in the batch; unparsable entries are logged and acked.
2. Resolve recipients for all events.
3. `NotificationAudienceService.load` runs **three** bulk queries for the whole batch (settings, known accounts, Telegram chat ids) plus at most one USD-rate lookup.
4. Gating runs entirely in memory (`NotificationSettingsService.isAllowed` is synchronous).
5. Fan-out uses **one** Redis pipeline for all feed writes and **one** for all Telegram queue writes.

| Constant | Default | Purpose |
|----------|---------|---------|
| `NOTIFICATION_STREAM_BATCH_SIZE` | 100 | `XREADGROUP COUNT` per poll |
| `NOTIFICATION_ROUTE_MAX_ATTEMPTS` | 2 | batch routing attempts before acking anyway |
| `NOTIFICATION_LOG_EVERY_N_EVENTS` | 500 | throughput log interval |

Constants live in `apps/notifications/src/constants/notification-stream.constants.ts`.

Entries are acked even when routing fails, so a poison batch cannot stall the stream.

On startup the consumer drains its own pending entries (`XREADGROUP` id `0`) before switching to new messages (`>`). The drain runs in the background so it never blocks application bootstrap.

chain-indexer publisher trims the stream with `XADD MAXLEN ~ 100000` (`NOTIFICATION_STREAM_MAX_LEN`).

## WebSocket endpoint

- **Path:** `/notifications/ws` (native `ws`; staging/production via nginx → `notifications:7200`)
- **Auth:** JWT in query `?token=` or `Authorization: Bearer` header (same secret as auth-api)
- **HTTP pages** `/notifications` and `/notifications/settings` are served by `apps/web`, not this service

## WebSocket connection limits

- `WS_MAX_CONNECTIONS_PER_USER` (default **5**): when a user opens a 6th connection, the oldest socket is closed with code `1008` / `connection_limit_exceeded`.

## Feed rules

- Max **50** items per user (`LTRIM 0 49` after `LPUSH`).
- TTL **14 days** (`EXPIRE`), refreshed on each write.

## WebSocket commands

| Event | Purpose |
|-------|---------|
| `get_notifications` | Returns `items` + `lastReadTimestamp` |
| `mark_read` | Sets server read cursor in `user_metadata.notifications_last_timestamp` |
| `subscribe` | `trx_processed` for a `trxId` |
| `notification` | Live feed item push |

## Producer (chain-indexer)

`NotificationEmitterService` emits a single in-process event `notification.event`; `NotificationAdapterService` publishes to the Redis Stream.

## Routing summary

See [routing.md](routing.md). Special cases: `trx_processed` (WS only, no feed), `object_created` (no-op).

## Swapping transport

Replace `NOTIFICATION_PUBLISHER` / `NOTIFICATION_CONSUMER` implementation bindings only; keep `NotificationEvent` JSON stable.
