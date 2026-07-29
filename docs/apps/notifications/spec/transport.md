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
| `notifications:cache:settings:{account}` | String (JSON) | notifications | settings cache TTL |

Legacy feed key `notifications:list:{username}` is still read during rollout and merged with the new key.

Consumer group: `notifications-consumers`.

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
