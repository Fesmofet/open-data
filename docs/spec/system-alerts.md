---
id: docs-spec-system-alerts
title: System alerts transport
description: Redis stream contract and library for operator/system Telegram delivery via notifications.
type: spec
status: active
scope: cross-cutting
tags: [notifications, redis, system-alerts]
updated_at: 2026-07-29
related:
  - docs/apps/notifications/spec/telegram-ops-bot.md
  - docs/apps/scheduler/spec/system-health.md
---

# System alerts transport

Cross-cutting queue for **operator-facing** alerts. Not used for per-user Hive notification delivery.

## Contract

- Library: `@opden-data-layer/system-alerts`
- Stream: `notifications:queue:system-alerts` (`SYSTEM_ALERT_STREAM_KEY`)
- Payload field: `payload` (JSON `SystemAlert`, validated with `systemAlertSchema`)
- Consumer group on notifications ops bot: `system-alerts-ops`

## Producers

Any service may publish via `SystemAlertPublisherService.publish(alert)`. Example: `apps/scheduler` job `system-health-check`.

**Do not** call the Telegram Bot API from producers. **Do not** reuse `notifications:queue:telegram`.

## Consumers

`apps/notifications` `TelegramOpsSenderService` reads the stream and fans out to `ops_telegram_subscribers` chats.

## Verification

```bash
pnpm nx test system-alerts
pnpm nx run system-alerts:typecheck
```
