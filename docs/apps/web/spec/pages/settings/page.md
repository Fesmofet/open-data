---
id: web-pages-settings
title: Settings page
description: "User preferences surface: locale, theme, and shell mode. Linked from the logged-in header account menu."
tags: [web, page, settings]
related:
  - docs/apps/web/spec/pages/index.md
type: spec
status: active
scope: web
updated_at: 2026-06-10
---

# Settings page (`/settings`)

**Back:** [web overview](../../overview.md) · **Related:** [i18n](i18n.md), [theme](theme.md), [shell-mode](shell-mode.md)

## Purpose

User preferences surface: locale, theme, and shell mode. Linked from the logged-in header account menu.

## Route

| Item | Detail |
|------|--------|
| Path | `/settings` — `apps/web/src/app/(app)/settings/page.tsx` |
| Auth | No server redirect; page is reachable when logged out (toolbar still works) |
| Metadata | `generateMetadata` → i18n `settings` key |

## UI

Renders `HomeI18nToolbar` from `apps/web/src/app/(app)/home-i18n-toolbar.tsx`:

| Control | Module |
|---------|--------|
| `LocaleSwitcher` | `@/i18n` — cookie + `router.refresh()` |
| `ThemeSwitcher` | `@/theme` via shared presentation |
| `ShellModeSwitcher` | `@/shell-mode` |
| Dev sign-in button | `LoginDialog` — **`NODE_ENV === 'development'` only** |

## Robots

Listed in `app/robots.ts` `disallow` — not intended for indexing.

## Verification

| Check | How |
|-------|-----|
| Locale change | Switch locale; `<html lang>` and copy update after refresh |
| Theme / shell | `data-theme` / `data-shell-mode` on `<html>` change |

## Related code paths

| Path | Role |
|------|------|
| `apps/web/src/app/(app)/settings/page.tsx` | Settings route |
| `apps/web/src/app/(app)/home-i18n-toolbar.tsx` | Preference controls |
