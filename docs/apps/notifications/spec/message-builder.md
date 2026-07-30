---
id: docs-apps-notifications-spec-message-builder
title: Notification message builder
description: Shared copy and links for web and future Telegram.
type: spec
status: active
scope: notifications
tags: [notifications, i18n]
updated_at: 2026-07-30
related:
  - docs/apps/notifications/spec/event-catalog.md
---

# Notification message builder

Library: `@opden-data-layer/notifications-messages`.

## API

```ts
buildNotificationMessage(event: AnyNotificationEvent): NotificationMessage
```

`NotificationMessage`:

| Field | Purpose |
|-------|---------|
| `key` | i18n key in `apps/web/src/i18n/locales/*.json` |
| `params` | Placeholders `{username}`, `{amount}`, … |
| `href` | Relative path for Next.js `Link` |
| `icon` | `follow` \| `vote` \| `reply` \| `wallet` \| `object` \| `bell` \| `generic` |
| `actor` | Avatar / display account |
| `paramHrefs` | Optional map of placeholder name → relative `href` for inline accent links on web |

Pure functions only — no Nest, React, or i18n runtime.

## Channels

- **Web**: `format-notification.ts` calls `buildNotificationMessage`, then `NotificationMessageText` renders i18n templates with `paramHrefs` as accent `Link` segments.
- **Telegram**: `renderTelegramBody(message, dict)` for the message body; `resolveNotificationAbsoluteUrl(message, baseUrl)` for the website button URL. `renderPlainText` remains for plain-text consumers that append the URL as a second line.

**Dictionary sync:** every i18n key emitted by `buildNotificationMessage` must exist in [`apps/notifications/src/telegram/en-dictionary.ts`](../../../../apps/notifications/src/telegram/en-dictionary.ts) with the same placeholder names as [`apps/web/src/i18n/locales/en-US.json`](../../../../apps/web/src/i18n/locales/en-US.json). `en-dictionary.spec.ts` asserts full coverage and no unfilled `{placeholder}` tokens in rendered Telegram bodies.

## Adding a type

1. Extend `NotificationPayloadMap` + `notificationEventSchema` in `notifications-contract`.
2. Add builder branch in the appropriate `builders/*.ts` file.
3. Add unit expectation in `registry.spec.ts`.
4. Add i18n key to all locale JSON files (UTF-8, no BOM).
5. Emit from chain-indexer (or other producer) via `NotificationEmitterService`.
