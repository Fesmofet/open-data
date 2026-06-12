---
description: 
globs: apps/web/src/**
alwaysApply: false
---

# web — agent rules

Specialization for this app. **Shared policy** (monorepo, docs standards, cross-cutting Nx) lives in the repo root [`AGENTS.md`](../../AGENTS.md). Web architecture and conventions are also documented under [`docs/apps/web/`](../../docs/apps/web/). This file is the **operational** checklist for `apps/web`.

## Stack

- **Next.js App Router** (`src/app/`) — not NestJS.

## Verification (before push / Docker)

| Command | What it checks |
|---------|----------------|
| **husky `pre-push`** | When pushed commits touch `apps/web/**` or `libs/**`, runs `pnpm typecheck:web` automatically (bypass: `git push --no-verify`; CI still enforces) |
| `pnpm typecheck:web` / `pnpm nx run web:typecheck` | `tsc --noEmit` (fast; same class of TS errors as prod build; CI `verify.yml`) |
| `pnpm check:web-i18n-utf8` | Locale JSON strict UTF-8 (CI `verify.yml`) |
| `pnpm nx run web:verify-production-build` | Full `next build ./apps/web` — manual smoke before Docker image (same as `apps/web/Dockerfile` builder) |

`next dev` does **not** typecheck — do not rely on dev alone. Does **not** run `docker build`; use that only when you need the full image. On Windows, standalone copy may warn (see `next.config.js`); TypeScript failures are what typecheck and production build catch.

## Environment variables (runtime, not build)

**Deployment-specific configuration is not baked into the web Docker image at build.** Staging, production, and custom hosts each set their own values in compose `.env` / `env_file` at container start. Operators can substitute URLs, secrets, and feature flags without rebuilding the image.

| Do | Don't |
|----|--------|
| Read deploy-specific vars on the **server** (`src/config/env.ts`, `get-*.ts` with `server-only`) | Put stack URLs or origins in **Docker build-args** or **`NEXT_PUBLIC_*`** so they are frozen at `next build` |
| Pass values into **Client Components** via root **layout providers** or server props | Read `process.env.NEXT_PUBLIC_*` in client code for per-deployment URLs (API bases, WS, IPFS content base, `ODL_NETWORK`, …) |
| Document new keys in `apps/web/.env.example` and root `.env.example` | Scatter raw `process.env` across `modules/` |

**Existing providers (copy this pattern):** `OdlNetworkProvider` (`ODL_NETWORK`), `NotificationsWsConfigProvider` (`NOTIFICATIONS_WS_PUBLIC_URL` via `getNotificationsWsPublicUrl()`), `IpfsContentBaseProvider` (`IPFS_CONTENT_BASE_URL` via `getIpfsContentBaseUrl()`).

Full rules: [`docs/apps/web/spec/web-conventions.md`](../../docs/apps/web/spec/web-conventions.md#env-config).

## Route groups and layouts

```
app/
  layout.tsx              Root: lang, dir, data-theme, data-shell-mode; ThemeProvider, ShellModeProvider, I18nProvider
  (app)/layout.tsx        App shell (header, nav, modals)
  (public)/layout.tsx     Public shell
  (immersive)/layout.tsx  Immersive shell
  api/                    BFF routes (auth challenge/verify/refresh/logout, callbacks)
```

- **Do not** add `'use client'` to root or segment **layout** files unless there is an exceptional, documented reason.

## Feature modules (`src/modules/<feature>/`)

Prefer clean-architecture layers:

```
domain/          types, ports, pure logic
application/     queries/, use-cases/, mappers/, dto/
infrastructure/  clients/, repositories/ (port implementations), providers/
presentation/    components/, hooks/
index.ts         public barrel — other features import only from here
```

- Full layering rules: [`docs/apps/web/spec/architecture.md`](../../docs/apps/web/spec/architecture.md) and [`docs/apps/web/spec/web-conventions.md`](../../docs/apps/web/spec/web-conventions.md).

## i18n (custom — not `next-intl`)

- Message catalogs: `src/i18n/locales/*.json`. **Strict UTF-8, no BOM**, valid JSON — enforced in CI (`verify.yml` → `scripts/verify-web-locale-json-utf8.cjs`); local: `pnpm check:web-i18n-utf8`.
- Scripts/agents that edit catalogs: **explicit UTF-8** on every read/write (Python `encoding='utf-8'`; Node **Buffer** + `TextDecoder('utf-8', { fatal: true })`). See repo root [`AGENTS.md`](../../AGENTS.md) **Web i18n locale catalogs**.
- Server: **`getRequestLocale()`** (cookies + `Accept-Language`), **`loadMessages()`** for the active catalog.
- Client: **`I18nProvider`** and **`useI18n()`** for `t(key)` lookups.
- Locale is **not** a URL segment — do **not** introduce `[locale]` segment routing.
- RTL: use **`isRtl(locale)`** from `src/i18n/domain/`; set **`dir`** on `<html>` in the root layout only.
- New locale: add JSON under `i18n/locales/` and register the locale in `i18n/config/locales.ts`.

## Design tokens

- Source of truth: **`src/styles/theme.css`** (`[data-theme='…']` CSS variables), extended in **`tailwind.config.js`**. Full token table: [`docs/apps/web/spec/theme.md`](../../docs/apps/web/spec/theme.md).
- Use **semantic** Tailwind utilities mapped to those variables in `className`, `@apply`, and component CSS — not Tailwind’s default scale or raw CSS literals (except documented exceptions below).
- New token role: update **`theme.css`** for every theme block, **`tailwind.config.js`**, and **`docs/apps/web/spec/theme.md`** in the same change.

### Colors

| Do | Don't |
|----|--------|
| `bg-bg`, `text-fg`, `border-border`, `text-link`, `bg-accent`, … | Raw `#…`, `rgb()`, `rgba()`, `hsl()` in `className` or inline `style` |

### Typography

| Do | Don't |
|----|--------|
| `text-body`, `text-body-sm`, `text-caption`, `text-section`, `text-display`, … | Tailwind defaults: `text-sm`, `text-lg`, `text-xl`, `text-2xl`, `text-[14px]`, … |
| `font-body`, `font-display`, `font-editorial`, `font-mono`, `font-label` | `font-sans`, `font-serif`, inline `font-family`, named stacks in components |
| `font-weight-body`, `font-weight-label`, `font-weight-strong`, `font-weight-display` | `font-normal`, `font-medium`, `font-semibold`, `font-bold` |
| `leading-body`, `leading-editorial`, `leading-display`, `leading-compressed` | `leading-tight`, `leading-snug`, `leading-relaxed`, magic line-height numbers |
| `tracking-body`, `tracking-caption`, `tracking-loose`, `tracking-display` | `tracking-wide`, `tracking-tighter`, arbitrary `tracking-[…]` |

Body copy inherits `var(--font-body)` from `global.css`; still set **`font-body`** (or **`font-display`** / **`font-editorial`**) when a block must use a different stack (headlines, article prose, code).

### Radius, elevation, layout

| Do | Don't |
|----|--------|
| `rounded-btn`, `rounded-card`, `rounded-pill`, `shadow-card`, `shadow-ring`, … | `rounded-md`, `rounded-lg`, `shadow-sm`, `shadow-lg`, ad-hoc `box-shadow` |
| `px-gutter`, `py-section-y`, `p-card-padding`, `max-w-container-content`, shell `*-shell-*` spacing | Raw `px-4`, `py-16`, `max-w-lg` when a layout token exists for the same role |

In plain CSS (e.g. Leaflet overrides), prefer **`var(--font-size-body)`**, **`var(--font-mono)`**, **`var(--radius-btn)`** over pixel literals.

### Documented exceptions

- **Hero/gallery chrome on photography** — use `.hero-on-photo-*` and `.gallery-*` classes in [`global.css`](src/app/global.css) only; do not scatter inline `text-white`, `bg-white/…`, or rgba `text-shadow` in components.
- **Third-party embed CSS** (Leaflet, sanitized post HTML) may use minimal literals when no hook exists; still prefer theme `var(--*)` where you control the stylesheet.
- **Video letterbox / iframe backgrounds** — `bg-black` on YouTube embeds and inline video iframes (`.blog-post-youtube-embed`, feed story video) is allowed.
- **External brand mimicry** (e.g. Facebook Open Graph preview in object create) may keep platform-specific hex colors, `rounded-md`/`rounded-lg`, and shadow literals on the mimic surface only.
- **Dropdown / media sizing** — arbitrary `min-w-[…]`, `max-h-[…]`, `aspect-[…]` when no layout token exists for that control.
- **Icon alignment** — `leading-none` on star ratings, carousel arrows, and similar non-text glyphs.

## Theme runtime

- **`src/theme/`** owns server resolution, cookies, and client `ThemeProvider`; set **`data-theme`** on `<html>` from here only. Do not read/write theme preference ad hoc outside this module.

## Shell mode

- **`data-shell-mode`** on `<html>` is set server-side.
- Use helpers from **`shell-mode-features.ts`** (`shouldHideHero`, `shouldUsePostGrid`, `getVisibleMenuKeys`, etc.) — **avoid** raw `resolvedMode === '…'` checks in feature components.
- Imports: **`@/shell-mode`** barrel only (see root AGENTS.md).
- New shell behavior: add a helper in **`shell-mode-features.ts`** and, if needed, CSS hooks in **`theme.css`** — not scattered string comparisons.

## Modals and overlays

Portaled `role="dialog"` UI **must** use **`ModalShell`** or **`AppModal`** from **`@/shared/presentation`** — not ad-hoc `createPortal` + custom dialog markup in feature modules.

| Use | Import |
|-----|--------|
| Tall/wide/custom overlays (post intercept, login, add-update, gallery, geo map) | **`ModalShell`** |
| Compact centered dialogs (vote list, reward breakdown) | **`AppModal`** (wraps `ModalShell`) |
| Z-index tiers | **`MODAL_Z_INDEX_*`** from `@/shared/presentation` (or `Z_INDEX_MODAL_ABOVE_MAP` in `@/modules/map` for map stack docs) |

### Required scroll architecture

```
shell:  fixed inset-0 overflow-hidden     ← never overflow-y-auto here
panel:  flex flex-col max-h-dvh overflow-hidden
body:   flex-1 min-h-0 overflow-y-auto overscroll-contain   ← only scroll container (when scrollBody)
```

Use **`header`** / **`footer`** slots on `ModalShell` for chrome that must stay visible while the body scrolls.

### Variants

| `variant` | When |
|-----------|------|
| `dialog` (default) | Centered card; optional `aside` (e.g. post modal action pills) |
| `fullscreen` | Gallery viewer, expanded geo map — set `scrollBody={false}` when layout is flex/media, not a scrolling list |

### Forbidden in modals

- `backdrop-blur` on modal scrims (use solid **`post-modal-scrim`** / `var(--color-modal-scrim)`)
- `overflow-y-auto` on outer `fixed inset-0` wrappers
- `max-h-[90vh] overflow-y-auto` on the panel root
- Ad-hoc scroll lock (`document.body.style.overflow`, duplicate `html.modal-open` logic) — **`ModalShell`** owns lock via **`useModalScrollLock`**

### Not `ModalShell` (documented exceptions)

| Pattern | Examples |
|---------|----------|
| Mobile nav drawer | **`DrawerRegion`** |
| Search / typeahead dropdowns | **`search-dropdown.tsx`**, editor object search fields |
| Floating toolbars / insert menus | **`editor-format-toolbar.tsx`**, **`editor-insert-menu.tsx`** |
| Notification / header dropdowns | **`notification-bell.tsx`**, **`logged-in-header-actions.tsx`** |

## Images

- **`next/image`** for user-facing raster (avatars, feed thumbnails, covers).
- Inline SVG or **`<img>`** for icons and decorative graphics.
- Markdown/HTML body images may use **`<img loading="lazy">`**.
- **IPFS CID previews:** **`useIpfsContentBaseUrl()`** — see [Environment variables (runtime, not build)](#environment-variables-runtime-not-build) and [`images.md`](../../docs/apps/web/spec/images.md#ipfs-object-images-cid).

## Object cards (`ObjectCard`)

**One component for every object card in the UI** — do not add parallel card implementations per screen.

| Canonical | Import |
|-----------|--------|
| **`ObjectCard`** | `@/modules/feed/presentation` (barrel) |
| Card excerpt helper | `truncateObjectCardDescription` from `@/modules/feed/application/dto/object-card-description` (300 chars + `…`) |

**Use `ObjectCard` for:** discover feed, user shop/recipe lists, post linked objects, object page menu catalog rows, and any future surface that shows a compact object preview (thumbnail, title, type · tags, ratings, description excerpt, admin heart).

**Do not:**

- Copy-paste card markup into feature modules (e.g. inline `ListItemCard`, bespoke `<article>` layouts).
- Reimplement description truncation, rating grid, or navigation (avatar + title only) outside `ObjectCard`.
- Add a second “object card” component when the layout is “close enough” — extend **`ObjectCard` props** instead (e.g. `linkReplace`, `onNavigateInColumn` if in-column navigation is needed).

**Data shape:** `ObjectCard` expects **`ProjectedObjectView`** (`@/modules/feed/application/dto/object-fields`). Map list/API DTOs at the boundary with **`projectedListItemToObjectView`** (`@/modules/object/application/mappers/projected-list-item-to-object-view`) — do not fork the card because the source type differs.

**In-column catalog nav:** pass **`onNavigate`** to `ObjectCard` (object page menu); omit for normal object-page links. List-type folder rows use **`ListCatalogRow`** in `object-list-content.tsx` only — not an object preview card.

**Tests:** component tests in `object-card.spec.tsx`; Playwright smoke in `apps/web-e2e/src/object-card-navigation.spec.ts` (mocked API, no DB).


- Server HTML for a Client Component’s first paint must **match** the client’s initial render.
- Avoid in the initial render of hydrated subtrees: `Date.now()`, `Math.random()`, locale/time formatting that differs SSR vs client, `typeof window` branching.
- Use **`useEffect`**, server-passed props, or small helpers (e.g. hydration-safe relative time) for client-only values.
- **`suppressHydrationWarning`** on **`next/link`** is only for known third-party DOM attribute injection (e.g. password managers), not to mask application bugs.

## Server vs client components

- Default to **Server Components**.
- Add **`'use client'`** only when hooks, events, or browser APIs require it.
- Pass server-fetched data as **props**; avoid **`useEffect`** solely to load initial data.

## API routes (`app/api/`)

- BFF / auth plumbing only — **delegate** to `src/shared/infrastructure/auth/` (and related helpers). No business rules in route handlers.

## SEO and metadata

**Canonical spec:** [`docs/apps/web/spec/seo.md`](../../docs/apps/web/spec/seo.md). **URL rewrites:** [`routing-proxy.md`](../../docs/apps/web/spec/routing-proxy.md).

Cross-cutting SEO lives in **`src/seo/`** — import via **`@/seo`** barrel only. Route files stay **thin**: `export async function generateMetadata` delegates to `@/seo` builders.

| Do | Don't |
|----|--------|
| Use `Metadata` / `generateMetadata` only | `next/head` or ad-hoc `<head>` in components |
| Object pages: read `model.seo` from query-api (`includeSeo: true`) | Hand-build object canonical URLs on web |
| Wrap shared loaders in `react.cache()` for metadata + page body | Duplicate fetches in `generateMetadata` |
| Post/profile JSON-LD in `src/seo/domain/` | SEO helpers in `src/shared/` |

Object `seo.canonical_url` and object `json_ld` are **query-api owned** — web injects only. Locale is not a URL segment — no `alternates.languages`. Sitemap/robots: `app/sitemap.ts`, `app/robots.ts` (see spec).

**Profile / page specs:** start at [`docs/apps/web/spec/pages/index.md`](../../docs/apps/web/spec/pages/index.md) (site map). Profile hub: [`profile-shell.md`](../../docs/apps/web/spec/pages/user-profile/profile-shell.md). Do **not** use legacy Waivio docs or any spec referencing `src/client/`.

## Shared code

- **`src/shared/`** uses the same layer idea as feature modules; import via **`@/shared`**.

## Loading UI

- **`loading.tsx`**: not used broadly today — add only when a route segment genuinely needs a Suspense boundary, not by default.

## Server actions

- Return types: use **`Result<T, E>`** from `src/shared/domain/result.ts` for expected failures (or an equivalent discriminated union such as `{ ok: value } | { error: code }`).
- **Never let infrastructure errors throw to the client.** Server Actions that call `fetch`, wallets, or other IO must catch network failures (`ECONNREFUSED`, timeouts, DNS) and return a typed error — uncaught throws become **500** on the action POST and can surface as **uncaught errors in the browser** (route crash).
- Use **`safeFetch`** from `src/shared/infrastructure/http/safe-fetch.server.ts` for outbound HTTP in Server Actions and route handlers unless there is a documented reason not to.
- Map stable **error codes** on the server (`service_unavailable`, `upload_failed`, `unauthorized`); map codes to **`t('…')` messages in Client Components** — do not show raw codes or stack traces.
- Parse JSON defensively (`try/catch` around `res.json()`); treat malformed bodies as `upload_failed` (or the appropriate domain code), not as thrown exceptions.

## Error handling (UI and Server Actions)

Plan error paths **when adding a feature**, not only after a production failure.

| Layer | Do | Don't |
|-------|-----|--------|
| **Server Action / server `fetch`** | Return `{ error: code }`; wrap `fetch` with `safeFetch`; log server-side if needed | `throw` on expected network/API failure |
| **Client hook calling a Server Action** | `try/catch` around the invocation; `startTransition` async bodies must not leak unhandled rejections | Assume the action always resolves `{ error }` — a 500 can still reject |
| **Form / modal / control** | Inline message with `role="alert"` (`text-error`); keep loading/submit state recoverable | Let the error bubble to the route segment or an unhandled rejection |
| **Page-level** | `error.tsx` for unexpected RSC failures; graceful empty/degraded UI when optional data is missing | Rely on error boundaries for routine “service down” cases |

**Reference implementations:** `upload-image.action.ts` + `useIpfsImageUpload` + `IpfsImageDropZone` / `ImageCidOrUrlForm` (IPFS upload unavailable).

**New user-facing i18n keys:** add to **every** `src/i18n/locales/*.json` file (strict UTF-8, no BOM) or provide a deliberate fallback to an existing key in client code.

## Form Rules

- Treat forms as contracts, not ad hoc UI handlers.
- Define one canonical schema per payload.
- Reuse the same validation rules on client and broadcast layer.
- Prefer safe parsing over exceptions.
- Return one consistent result shape from every form flow.
- Keep field errors separate from form-level errors.
- Derive validation state from the schema when possible.
- Handle invalid, pending, error, and success states explicitly.
- Normalize input consistently before broadcast.
- Do not add form libraries unless complexity clearly requires them.

## Blockchain broadcast and trx confirmation

After every successful **Hive wallet broadcast** that should update on-chain-backed UI:

1. Capture **`transactionId`** → **`awaitTrxConfirmation(trxId)`** from **`@/modules/notifications`** (WS via **`/api/auth/ws-token`**; see [`docs/apps/notifications/spec/transport.md`](../../docs/apps/notifications/spec/transport.md)).
2. In-place loading on the control while waiting; optimistic UI until broadcast finishes.
3. On confirm **or** **`TRX_CONFIRMATION_TIMEOUT_MS`** (10s): **`refreshAfterBroadcast(router, revalidate*)`** from `@/shared/infrastructure/query/refresh-after-broadcast` — **never treat timeout as hard error**.
4. RSC-seeded paginated lists: **`useSyncedPaginatedList`** after refresh — `useState(initial*)` for rows does not update.
5. Invalidate query-api GET cache tags via `revalidateObjectAfterBroadcast` / `revalidateUserSocialAfterBroadcast` / `revalidateUserFeedAfterBroadcast` — not `queryApiFetchLive` on every page load.

**ODL `custom_json`:** **`useOdlCustomJsonId()`** — do not hardcode network ids. Reference: `story-vote-button.tsx`, `story-comment-editor.tsx`.

## `router.refresh()` and client state

Use **`router.refresh()`** from `next/navigation` when server-rendered data should catch up after a mutation (broadcast confirmed, login/logout, locale change, draft save, etc.). It **re-runs Server Components** for the current route and passes **new props** into existing client boundaries — it is **not** a full page reload and **does not** remount client components by default.

| Updates after refresh | Does **not** update automatically |
|-----------------------|-------------------------------------|
| Props from RSC parent (`model`, counts in nav, `initialPage` passed as prop) | `useState(initialValue)` seeded once at mount |
| Server-only fetches in `page.tsx` / `layout.tsx` | Client list rows, cursor, load-more accumulation |
| Metadata / cookies read on the server | `key` on a child unless the key value changes |

**Checklist for new client UI after a mutation + `router.refresh()`:**

1. **Scalar / flags from props** (follow, bell, authority, vote on a row): keep optimistic local state, add **`useEffect`** to sync when the prop changes — see `user-profile-hero-client.tsx`, `story-vote-button.tsx`.
2. **Paginated lists** from RSC (`initialPage`, `initialItems`): use **`useSyncedPaginatedList`** from `@/shared/presentation` — see `user-social-account-list.tsx`, `object-updates-feed.tsx`, `blog-feed-posts-list.tsx`. Do not rely on Next.js cache invalidation alone; the bug is client `useState`, not stale RSC cache.
3. **Avoid** bumping `key` on every refresh just to reset lists — it drops scroll position and load-more state. Prefer explicit sync.
4. **Symptom to watch for:** server counts or tab badges change, but list rows or card fields stay old — missing sync after refresh.

Primary pattern elsewhere in the app: **`awaitTrxConfirmation(trxId)` → `refreshAfterBroadcast(router, revalidate*)`**. Always refresh even on trx timeout so the UI eventually matches chain/indexer state.

## Infinite scroll on feeds

All central feed components that support cursor or offset pagination must use **`useInfiniteScroll`** from `@/shared/presentation` with a sentinel element at the list bottom. Scrolling to the end auto-triggers the next page fetch.

| Do | Don't |
|----|--------|
| Use `useInfiniteScroll({ hasMore, isLoading, onLoadMore })` + a sentinel `<div ref={sentinelRef} aria-hidden />` | Add visible "Load more" / "Show more" buttons on feeds |
| Keep an **`sr-only`** button wired to the same `onLoadMore` handler (keyboard fallback) | Rely on scroll alone without an accessible control |
| Pass **`isLoading`** / `pending` to prevent double-triggers while a page is in flight | Fire load-more when `isLoading` is true or `hasMore` is false |
| Pair with **`useSyncedPaginatedList`** when the list is RSC-seeded (`initialPage` / `initialItems`) | Reset list state with a `key` bump on every refresh — drops scroll position |

Reference implementations: `blog-feed-posts-list.tsx`, `user-social-account-list.tsx`, `object-updates-feed.tsx`, `object-ref-list-feed.tsx`, `discover-object-feed.tsx`, `discover-user-feed.tsx`.

## Hydration warnings — browser extensions (Keychain, password managers)

Browser extensions (primarily **Keychain Hive** and password managers) inject attributes or classes on `<a>` elements *after* SSR HTML is sent but *before* React hydrates. This produces a `className` mismatch warning that **cannot be reproduced without the extension** and is safe to suppress.

### Rule

**All `<Link>` (and plain `<a>`) elements that are navigation anchors must carry `suppressHydrationWarning`** to silence these false-positive mismatches.

```tsx
<Link href={href} suppressHydrationWarning …>
  …
</Link>
```

For raw `<a>` elements use the existing wrapper:

```tsx
import { HydrationSafeAnchor } from '@/shared/presentation/components/hydration-safe-anchor';

<HydrationSafeAnchor href={href} …>…</HydrationSafeAnchor>
```

### When NOT to suppress

Do **not** add `suppressHydrationWarning` to hide real mismatches caused by:
- `typeof window !== 'undefined'` branches in initial render
- `Date.now()`, `Math.random()`, or locale-formatted dates rendered server-side
- Stale server cache diverging from client state

Those must be **fixed** (use `useEffect`, `suppressHydrationWarning` on the specific element only after confirming the mismatch is extension-only).

### How to tell the difference

If the diff in the console shows only `keychainify-checked` added to `className` → Keychain extension, safe to suppress.
If the diff shows data/content changes → real mismatch, fix the root cause.

## Maps (`src/modules/map/`)

- **Public API:** `AppMap`, `AppMarker`, `AppPopup`, `MapProvider`, and types from `@/modules/map` — do **not** import `react-leaflet`, `leaflet`, or MapLibre directly in feature UIs.
- **SSR:** maps are **client-only**; `AppMap` is dynamically loaded. Never instantiate Leaflet in Server Components or root layouts.
- **Engine swap:** implement `MapProviderPort` and pass `<MapProvider impl={…} />`. Default is Leaflet (`leafletMapProvider`).
- **Spec:** [`docs/apps/web/spec/maps.md`](../../docs/apps/web/spec/maps.md).