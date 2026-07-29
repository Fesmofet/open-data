# system-alerts

Shared contract and health checks for operator system alerts (Redis stream → notifications ops Telegram bot).

## Commands

```bash
pnpm nx run system-alerts:typecheck
pnpm nx test system-alerts
```

## Docs

- Transport: [`docs/spec/system-alerts.md`](../../docs/spec/system-alerts.md)
- Scheduler producer: [`docs/apps/scheduler/spec/system-health.md`](../../docs/apps/scheduler/spec/system-health.md)
- Notifications consumer: [`docs/apps/notifications/spec/telegram-ops-bot.md`](../../docs/apps/notifications/spec/telegram-ops-bot.md)

Producers use `SystemAlertPublisherService`; consumers validate with `systemAlertSchema` and render via `renderSystemAlertText`.
