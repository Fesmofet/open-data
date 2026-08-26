---
id: web-pages-object-page-shell
title: Object page shell
description: "Layout, regions, and browse/edit modes for the object detail route. Tab URLs and nested `?path=` behavior: navigation.md. Per-tab content: routes/."
type: spec
status: active
scope: web
tags: [web, page, object, layout]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/overview.md
  - docs/apps/web/spec/pages/index.md
  - docs/apps/web/spec/pages/object/data-loading.md
  - docs/apps/web/spec/pages/object/navigation.md
  - docs/apps/web/spec/routing-proxy.md
  - docs/apps/web/spec/object-follow.md
---

# Object page shell (`/object/:id`)

**Back:** [Pages index](../index.md) · [web overview](../../overview.md) · **Related:** [data-loading](data-loading.md), [navigation](navigation.md), [routing-proxy](../../routing-proxy.md)

## Purpose

Layout, regions, and browse/edit modes for the object detail route. Tab URLs and nested `?path=` behavior: [navigation.md](navigation.md). Per-tab content: [routes/](routes/).

## Public URLs

| Pattern | Notes |
|---------|--------|
| `/object/:id` | Default landing — see navigation § default landing |
| `/object/:id/<tab>` | Proxy rewrite → `?tab=<tab>` — [routing-proxy](../../routing-proxy.md) |
| `/object/:id?path=a,b` | Nested catalog stack in center column |

Single App Router entry: [`page.tsx`](../../../../../apps/web/src/app/(app)/object/[object-id]/page.tsx) + [`object-page-client.tsx`](../../../../../apps/web/src/app/(app)/object/[object-id]/object-page-client.tsx).

## Layout regions

| Region | Component | Notes |
|--------|-----------|--------|
| Hero | `ObjectHero` | Follow/bell — [object-follow.md](../../object-follow.md); edit toggle |
| Left rail | `ObjectLeftRail` | Menu blocks, product **options** (variant selectors) — [routes/options.md](routes/options.md), edit `+` — [routes/edit-mode.md](routes/edit-mode.md) |
| Center | `ObjectPrimaryContent` | Tab content, nested stack, description |
| Right rail | `ObjectRightSidebar` / `ObjectEditRightRail` | [routes/right-rail.md](routes/right-rail.md) |

Shell grid: [`ObjectViewShell`](../../../../../apps/web/src/modules/object/presentation/components/object-view-shell.tsx) — `shell-object-page-grid` at `lg+`.

## Browse vs edit mode

| Mode | Right rail | Left rail |
|------|------------|-----------|
| Browse | Related / Similar / Add-On / Followers previews | Read-only blocks |
| Edit (logged-in) | Preview + completeness panels | `+` add update — [routes/edit-mode.md](routes/edit-mode.md) |

Gated by hero Edit toggle + `viewerUsername` from server.

## Module layout

| Module | Role |
|--------|------|
| `@/modules/object` | Page model, presentation, resolve actions |
| `@/modules/object-updates` | Update cards, add-update modal |
| `@/modules/object-create` | Preview/completeness panels in edit mode |
| `@/modules/user-social` | Followers list on tab |
| `@/seo` | `buildObjectMetadata`, JSON-LD inject |

## Route specs

| Segment | Spec |
|---------|------|
| Navigation / tabs / `?path=` | [navigation.md](navigation.md) |
| Reviews (Posts / Threads / Activity) | [routes/reviews.md](routes/reviews.md) |
| Updates | [routes/updates.md](routes/updates.md) |
| Gallery | [routes/gallery.md](routes/gallery.md) |
| Followers | [routes/followers.md](routes/followers.md) |
| Ownership | [routes/ownership.md](routes/ownership.md) |
| Related / Similar / Add-On feeds | [routes/ref-feeds.md](routes/ref-feeds.md) |
| Category objects feed | [routes/category-feed.md](routes/category-feed.md) |
| Edit mode | [routes/edit-mode.md](routes/edit-mode.md) |
| Right rail | [routes/right-rail.md](routes/right-rail.md) |

## Verification

| Command | Purpose |
|---------|---------|
| `pnpm nx run web:typecheck` | Object page types |
| Manual | `/object/:id`, tab URLs, edit toggle, nested menu drill-down |

## Related code paths

| Path | Role |
|------|------|
| `apps/web/src/app/(app)/object/[object-id]/page.tsx` | SSR orchestration |
| `apps/web/src/app/(app)/object/[object-id]/object-page-client.tsx` | Client tab + path sync |
| `apps/web/src/modules/object/presentation/components/object-primary-content.tsx` | Center column |
