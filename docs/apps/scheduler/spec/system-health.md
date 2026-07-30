---
id: docs-apps-scheduler-spec-system-health
title: System health check job
description: Cron job comparing indexer Redis cursors to Hive and Hive Engine head; publishes system alerts.
type: spec
status: active
scope: scheduler
tags: [scheduler, health, telegram]
updated_at: 2026-07-29
related:
  - docs/apps/notifications/spec/telegram-ops-bot.md
  - docs/spec/system-alerts.md
---

# System health check

Job `system-health-check` runs every **30 minutes** (`*/30 * * * *`). It uses `@opden-data-layer/system-alerts` `SystemHealthCheckService` to compare:

| Check | Redis cursor key |
|-------|------------------|
| chain-indexer hive | `chain-indexer:cache:hive:block-number` |
| chain-indexer hive-engine | `chain-indexer:cache:hive-engine:block-number` |

against live Hive `head_block_number` and Hive Engine `lastBlockNumber` (Hive Engine head is fetched with up to **3** attempts, 1s apart, before marking unavailable). A cursor is **ok** when `actualBlock + SYSTEM_HEALTH_BLOCK_LAG_BUFFER >= headBlock`.

When any check fails, the runner publishes one `SystemAlert` (`source: 'scheduler'`, severity `warn`) to `notifications:queue:system-alerts`. Successful runs log at `debug` only (no Telegram).

Delivery to operators is handled by **notifications** ops bot — see [telegram-ops-bot.md](../../notifications/spec/telegram-ops-bot.md).

## Configuration

| Variable | Default | Notes |
|----------|---------|-------|
| `SYSTEM_HEALTH_BLOCK_LAG_BUFFER` | `100` | Same semantics as legacy notifier buffer |

Hive / Hive Engine clients are already registered globally in `SchedulerModule`.

## Manual run

```bash
pnpm nx build scheduler
node dist/apps/scheduler/main.js --run-job=system-health-check
```

## Extending alerts

New producers should depend on `@opden-data-layer/system-alerts` and call `SystemAlertPublisherService.publish()` with a typed `SystemAlert`. Do not call Telegram from scheduler or other apps directly.
