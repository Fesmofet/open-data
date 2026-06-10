---
id: web-pages-home
title: Home page
tags: [web, page, home]
related:
  - docs/apps/web/spec/pages/index.md
type: spec
status: active
scope: web
updated_at: 2026-06-10
---

# Home page (`/`)

**Back:** [web overview](../../overview.md) · **Related:** [seo](seo.md)

## Purpose

App root landing route under `(app)` shell. Currently a placeholder; metadata is fully wired via `@/seo`.

## Route

| Item | Detail |
|------|--------|
| Path | `/` — `apps/web/src/app/(app)/page.tsx` |
| Shell | `(app)/layout.tsx` — header + bottom nav |
| Content | Static welcome heading + placeholder copy |

## Metadata

`generateMetadata` → `buildHomeMetadata({ locale, messages })` from `@/seo`.

Included in `app/sitemap.ts` with `priority: 1`, `changeFrequency: daily`.

## Future work

Replace placeholder with product home feed or marketing content; keep metadata builder in `@/seo`.

## Verification

| Command | Purpose |
|---------|---------|
| `pnpm nx run web:typecheck` | Metadata types |
| Manual | View `/` title and OG tags |

## Related code paths

| Path | Role |
|------|------|
| `apps/web/src/app/(app)/page.tsx` | Home RSC |
| `apps/web/src/seo/application/build-home-metadata.ts` | Title/description |
