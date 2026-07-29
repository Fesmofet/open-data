---
id: docs-apps-notifications-spec-routing
title: Notification routing
description: Recipient resolution strategies in apps/notifications.
type: spec
status: active
scope: notifications
tags: [notifications, routing]
updated_at: 2026-07-28
related:
  - docs/apps/notifications/spec/event-catalog.md
  - docs/apps/notifications/spec/transport.md
---

# Notification routing

`NotificationRouterService` is thin: validate event → pick strategy → resolve recipients → filter by `NotificationSettingsService` → `NotificationFeedService.addToFeed` (except `trx_processed`).

## Strategies

Registered in `RecipientStrategyRegistry` (`domain/routing/`):

| Strategy | `supports()` | `resolveRecipients()` |
|----------|--------------|------------------------|
| **Direct** | Wallet L1/engine, follow, batch import | Explicit accounts from payload (`to`, `from`, `following`, …) |
| **PostAuthor** | `reply`, `mention`, `vote_like`, `vote_downvote`, `reblog` | Parent/post author from payload |
| **SelfActor** | `my_post`, `my_comment`, `my_vote` | `event.actor` |
| **ObjectAudience** | Object updates, votes, status | Creator + administrative authority + object bell (`user_object_follows.bell`) |
| **UserBell** | `bell_post`, `bell_reblog`, `bell_follow`, `bell_object_post`, `bell_thread` | `user_subscriptions.bell` subscribers or object bell followers |
| **ThreadAuthorFollower** | `thread_author_follower` | `payload.mentions` + account bell subscribers of `payload.author` |

First matching strategy wins. `object_created` is intentionally dropped (use `object_update`). `trx_processed` pushes to WS subscribers for `trxId` only.

## Read cursor

`user_metadata.notifications_last_timestamp` updated via WebSocket `mark_read`. `get_notifications` returns `lastReadTimestamp` with the feed.

## Feed storage

Redis list key: `notifications:cache:feed:{username}` (legacy `notifications:list:{username}` merged on read during rollout).
