---
id: web-pages-tools
title: Tools hub
description: Personal tools area (Notifications settings, Drafts, Settings). Not in hub section nav; reachable via direct URL or avatar menu.
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

All four use the hub layout (FEED / DISCOVER / MARKET section nav above) and the **Personal:** left sidebar. TOOLS is not a section-nav tab; open via `/tools`, `/drafts`, `/notifications/settings`, `/settings`, or the avatar menu **Tools** link.

Implementation: [`apps/web/src/modules/tools/`](../../../../apps/web/src/modules/tools/), layout at [`(hub)/(tools-shell)/layout.tsx`](../../../../apps/web/src/app/(app)/(hub)/(tools-shell)/layout.tsx).

## Avatar menu

- **Settings** → `/notifications/settings` (entry into tools-shell; locale/theme/shell prefs at `/settings` via `ToolsLayoutNav` sidebar only)
- **Wallet** → `/@:username/transfers?type=WAIV`
- **Earn** removed from menu

`/notifications` feed remains outside the tools shell (no sidebar).
