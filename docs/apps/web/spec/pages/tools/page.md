---
id: web-pages-tools
title: Tools hub
description: Hub TOOLS tab with Personal sidebar (Notifications settings, Drafts, Settings).
type: spec
status: active
scope: web
tags: [web, page, tools]
updated_at: 2026-07-31
related:
  - docs/apps/web/spec/pages/index.md
  - docs/apps/web/spec/pages/drafts/page.md
  - docs/apps/web/spec/pages/notifications/settings.md
---

# Tools hub

**Back:** [site map](index.md)

## Routes

| URL | Content |
|-----|---------|
| `/tools` | Redirects to `/notifications/settings` |
| `/drafts` | Post drafts list (auth required) |
| `/notifications/settings` | Notification toggles + Telegram link |
| `/settings` | Locale, theme, and shell mode preferences |

All four show hub section nav (HOME / DATA / BUSINESS / **TOOLS**) and the **Personal:** left sidebar.

Implementation: [`apps/web/src/modules/tools/`](../../../../apps/web/src/modules/tools/), layout at [`(hub)/(tools-shell)/layout.tsx`](../../../../apps/web/src/app/(app)/(hub)/(tools-shell)/layout.tsx).

## Avatar menu

- **Tools** → `/tools`
- **Wallet** → `/@:username/transfers?type=WAIV`
- **Earn** removed from menu

`/notifications` feed remains outside the tools shell (no sidebar).
