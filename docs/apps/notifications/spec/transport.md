---
id: docs-apps-notifications-spec-transport
title: Notifications transport
description: Cross-service events flow from **chain-indexer** to **notifications** via a Redis Stream. The JSON contract is defined in `@opden-data-layer/notifications-contract`.
type: spec
status: active
scope: notifications
tags: [notifications, transport]
updated_at: 2026-07-28
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
| `notifications:cache:settings:{account}` | String (JSON) | notifications | settings cache TTL (includes negative cache sentinel when no row) |
| `notifications:cache:telegram:subs:{account}` | String (JSON) | notifications | Telegram chat IDs per Hive account (TTL 300s) |

Legacy feed key `notifications:list:{username}` is still read during rollout and merged with the new key.

Consumer group: `notifications-consumers`. Stable consumer name: `NOTIFICATIONS_CONSUMER_NAME` (default `notifications-1`).

## Stream consumer throughput

`RedisStreamNotificationConsumer` settings (constants in `apps/notifications/src/constants/notification-stream.constants.ts`):

| Constant | Default | Purpose |
|----------|---------|---------|
| `NOTIFICATION_STREAM_BATCH_SIZE` | 100 | `XREADGROUP COUNT` per poll |
| `NOTIFICATION_ROUTE_CONCURRENCY` | 20 | parallel `route()` calls per batch |
| `NOTIFICATION_ROUTE_MAX_ATTEMPTS` | 2 | retries before ack on route failure |
| `NOTIFICATION_LOG_EVERY_N_EVENTS` | 500 | throughput log interval |

On startup the consumer drains its own pending entries (`XREADGROUP` id `0`) before reading new messages (`>`).

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
