---
id: web-pages-home
title: Home page
description: App root landing under the hub shell. Section nav (HOME / DATA / BUSINESS / TOOLS) plus a stub agent chat composer.
tags: [web, page, home]
related:
  - docs/apps/web/spec/pages/index.md
  - docs/apps/web/spec/pages/discover/page.md
  - docs/apps/web/spec/pages/business/overview.md
type: spec
status: active
scope: web
updated_at: 2026-07-17
---

# Home page (`/`)

**Back:** [web overview](../../overview.md) · **Related:** [seo](../seo.md)

## Purpose

App root landing under `(app)/(hub)`. Shows hub section nav and a stub agent composer (no backend yet). Metadata via `@/seo`.

## Route

| Item | Detail |
|------|--------|
| Path | `/` — `apps/web/src/app/(app)/(hub)/page.tsx` |
| Shell | `(app)/layout.tsx` (AppHeader) + `(hub)/layout.tsx` (HOME / DATA / BUSINESS / TOOLS nav) |
| Content | Centered agent chat composer stub |

## Hub section nav

Shared by `/`, `/discover`, `/business*`, `/tools`, `/drafts`, `/notifications/settings`, `/settings`. Not shown on profiles, objects, or other `(app)` routes.

| Tab | Route | Active |
|-----|-------|--------|
| HOME | `/` | exact `/` |
| DATA | `/discover` | `/discover` prefix |
| BUSINESS | `/business` | `/business` prefix |
| TOOLS | `/notifications/settings` | `/tools`, `/drafts`, `/notifications/settings`, `/settings` — see [tools/page.md](../tools/page.md) |

Component: `AppSectionNav` (`@/modules/app-header`) — underline tabs via `profileSectionTabClass` (same as profile primary menu), labels uppercase.

## Agent composer stub

`HomeAgentComposerStub` (`@/modules/home`): pill input with attach / field / send affordances. Placeholder i18n `home_agent_composer_placeholder`. Submit is a no-op (no agent API).

## Metadata

`generateMetadata` → `buildHomeMetadata({ locale, messages })` from `@/seo`.

Included in `app/sitemap.ts` with `priority: 1`, `changeFrequency: daily`.

## Future work

Wire composer to a real agent chat; keep hub nav and metadata builders.

## Verification

| Command | Purpose |
|---------|---------|
| `pnpm nx run web:typecheck` | Types |
| Manual | `/` shows nav + stub; `/@user` has no hub nav |

## Related code paths

| Path | Role |
|------|------|
| `apps/web/src/app/(app)/(hub)/page.tsx` | Home RSC |
| `apps/web/src/app/(app)/(hub)/layout.tsx` | Hub section nav shell |
| `apps/web/src/modules/app-header/presentation/components/app-section-nav.tsx` | HOME / DATA / BUSINESS |
| `apps/web/src/modules/home/presentation/components/home-agent-composer-stub.tsx` | Composer stub |
| `apps/web/src/seo/application/build-home-metadata.ts` | Title/description |
