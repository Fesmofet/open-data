---
id: web-app-header
title: App header
type: spec
status: active
scope: web
tags: [web, layout, app-header]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/overview.md
  - docs/apps/web/spec/search.md
---

# App header

**Back:** [web overview](overview.md) · **Related:** [layout-system](layout-system.md), [search](search.md), [notifications](pages/notifications/page.md), [auth](auth.md)

## Purpose

Global chrome for the `(app)` route group: brand link, predictive search, notifications bell, and session actions. Implemented as `AppHeader` in `@/modules/app-header`, mounted from [`apps/web/src/app/(app)/layout.tsx`](../../../../apps/web/src/app/(app)/layout.tsx).

## Layout

| Zone | Behavior |
|------|----------|
| Brand | Link to `/`; on small screens hidden while mobile search is expanded. |
| Search | Debounced query → `/api/search` — see [search.md](search.md). `lg+`: always visible. Below `lg`: expand/collapse toggle. |
| Actions (logged out) | `LoginDialog` + `LocaleSwitcher`. |
| Actions (logged in) | [`LoggedInHeaderActions`](../../../../apps/web/src/modules/app-header/presentation/components/logged-in-header-actions.tsx): **write** → `/editor`; **`NotificationBell`**; avatar → `/@:username`; chevron → account menu. |

### Logged-in account menu

| Item | Behavior |
|------|----------|
| My feed | `/@:username` |
| Earn, Tools, Wallet | Disabled — `app_header_coming_soon` tooltip |
| Create object | `/object-create` |
| Drafts | `/drafts` |
| My profile | `/@:username/about` |
| Settings | `/settings` |
| Logout | `POST /api/auth/logout` + `router.refresh()` |

Notifications UI: [notifications.md](pages/notifications/page.md). Editor entry: [editor.md](pages/editor/page.md).

Sticky bar: `sticky top-0 z-40`, `min-h-shell-header`, nav tokens (`bg-nav-bg`, `border-border`, `backdrop-filter: var(--backdrop-nav)`). Account dropdown uses `z-[60]`.

## Session

`createCookieAuthContextProvider().getUser()` in the `(app)` layout passes `{ username }` or `null` into the header. No global client auth context.

## Profile link

The profile control uses the public path `/@:name`. Rewrites: [routing-proxy.md](routing-proxy.md).

## Shell mode

Global header does **not** use profile-only helpers (`shouldHideHero`, etc.). It relies on shared structural tokens such as `--shell-header-height` / `min-h-shell-header`.

## i18n

Message keys prefixed with `app_header_*` (see `en-US.json`); brand copy uses `app_header_brand_text`. Logged-in labels reuse shared keys (`my_feed`, `write_post`, `notifications`, `earn`, etc.).

## Verification

| Check | How |
|-------|-----|
| Search | Type query; dropdown shows objects/users; discover chips navigate |
| Notifications | Bell badge + dropdown — [notifications.md](pages/notifications/page.md) |

## Related code paths

| Path | Role |
|------|------|
| `apps/web/src/modules/app-header/presentation/components/top-nav.tsx` | Search shell |
| `apps/web/src/modules/app-header/presentation/components/logged-in-header-actions.tsx` | Session actions |
