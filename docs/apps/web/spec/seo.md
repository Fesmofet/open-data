---
id: web-seo
title: SEO and metadata
type: spec
status: active
scope: web
tags: [web, seo, cross-cutting]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/overview.md
  - docs/apps/web/spec/i18n.md
  - docs/apps/web/spec/routing-proxy.md
  - docs/apps/web/spec/architecture.md
---

# SEO and metadata

**Back:** [web overview](overview.md) · **Related:** [i18n](i18n.md), [architecture](architecture.md)

## Purpose

Normative rules for HTML metadata, Open Graph, Twitter cards, JSON-LD, canonical URLs, sitemap, and robots. Implementation lives in `@/seo` — not in `src/shared/` or inline page components.

## Module layout

```
apps/web/src/seo/
  domain/           metadata contracts, JSON-LD builders (post/profile), canonical helpers
  application/      build*Metadata use-cases per route type
  infrastructure/   seoPublicOrigin, sitemap fetchers, absolute URL helpers
  presentation/     JsonLdScript (server component)
  index.ts          public barrel — import only from @/seo
```

Route files keep thin `export async function generateMetadata` that delegates to `@/seo` builders.

## Metadata API rules

- Use Next.js **`Metadata` / `generateMetadata`** only — never `next/head`.
- Root defaults: `app/layout.tsx` — `metadataBase` from `env.publicOrigin`, title template, default OG/Twitter.
- Locale: builders call `getRequestLocale()` + `loadMessages()` internally — locale is **not** a URL segment; do not use `alternates.languages`.
- Shareable pages must not hardcode English when i18n keys or API fields exist.

## Object pages

`ProjectedObject.seo` from query-api when `includeSeo: true`:

| Field | Web usage |
|-------|-----------|
| `title`, `description` | `buildObjectMetadata` |
| `canonical_url` | **Source of truth** — web must not hand-build object canonicals |
| `json_ld` | Inject via `<JsonLdScript>` when non-empty; web does not patch schema.org for objects |

Loader used by metadata **and** page body must use `react.cache()` and request `includeSeo: true`.

## Post and profile pages

- **Posts:** `buildPostMetadata` + `buildArticleJsonLd` in `seo/domain/`.
- **Profiles:** `buildProfileMetadata` + `buildPersonJsonLd`; canonical via `profileCanonical(origin, name)`.
- **Home / discover / sign-in:** `buildHomeMetadata`, `buildDiscoverMetadata`, `buildSignInMetadata`.

## Open Graph images

Resolve relative API URLs with `buildPublicUrl()` / `seoPublicOrigin()`. Fallback: `app/opengraph-image.png`. Use `twitter.card: 'summary_large_image'` when an OG image exists.

## Sitemap and robots

| File | Behavior |
|------|----------|
| `app/sitemap.ts` | `revalidate: 3600`; home + discover objects/users (limit 5000 each) via `fetchDiscoverObjectsForSitemap` / `fetchDiscoverUsersForSitemap` |
| `app/robots.ts` | Allow `/`; disallow `/sign-in`, `/api/`, `/editor`, `/drafts`, `/settings`, `/notifications`; `sitemap` + `host` from `seoPublicOrigin()` |

## Edge cases

| Situation | Behavior |
|-----------|----------|
| API returned no `seo` | Fall back to root metadata defaults; route must not throw |
| Empty `json_ld` | Skip `JsonLdScript`; HTML meta still from `Metadata` |
| Missing OG image | Default site banner |

## Verification

| Command | Purpose |
|---------|---------|
| `pnpm nx test web --testPathPattern=seo` | Canonical, JSON-LD, metadata builders |
| Manual | View source on `/object/:id`, `/@user`, post permalink — single canonical, OG tags |

## Related code paths

| Path | Role |
|------|------|
| `apps/web/src/seo/application/build-object-metadata.ts` | Object route metadata |
| `apps/web/src/app/sitemap.ts` | Dynamic sitemap |
| `apps/web/src/app/(app)/object/[object-id]/object-page-model.server.ts` | Cached loader + SEO fetch reference |
