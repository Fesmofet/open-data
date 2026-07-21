---
id: web-images
title: web — images and `next/image`
description: "Normative rules for raster images in `apps/web`: when to use Next.js `Image`, how to configure remotes, and what to avoid."
type: spec
status: active
scope: web
tags: [web, images]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/overview.md
---

# web — images and `next/image`

**Back:** [web overview](overview.md) · **Related:** [web conventions](web-conventions.md), [architecture](architecture.md)

Normative rules for raster images in `apps/web`: when to use Next.js [`Image`](https://nextjs.org/docs/app/api-reference/components/image), how to configure remotes, and what to avoid.

## Purpose

- **Performance:** responsive `srcset`, modern formats (WebP/AVIF where supported), lazy loading, and stable layout (CLS).
- **Consistency:** one pattern for user-facing photos (avatars, feed media, covers) and a different pattern for icons and rich text.

## Decision table

| Category | Use | Rationale |
|----------|-----|-----------|
| Feed thumbnails / post preview images | `next/image` (often `fill` in a sized container) | Largest visual payload; UGC aspect ratios vary — container defines layout |
| Avatars (user, tagged objects) | `next/image` with explicit `width` / `height` and `sizes` | Fixed display size; many instances per view |
| Profile / hero cover images | `next/image` with `fill`, `priority`, `sizes` | Above-the-fold; avoid delaying LCP |
| Small UI (icons, decorative graphics) | Inline SVG or static `<img>` | `Image` adds little value; SVG scales cleanly |
| Markdown or rich HTML body images (future) | Plain `<img>` with `loading="lazy"` | Arbitrary URLs and dimensions; integrating `Image` in markdown renderers is high cost |

## Configuration (`next.config.js`)

- **`images.remotePatterns`** — allowlisted hosts for the default image optimizer. The app loads **UGC** from many domains (thumbnails, covers, custom avatars). The config includes known CDNs and broad **HTTPS** and **HTTP** patterns (`hostname: '**'`) so arbitrary public hosts work, including legacy **`http://`** URLs (e.g. older imgur links).
- **`images.minimumCacheTTL`** — set to **86400** (24h) to reduce repeated optimization work for stable UGC URLs.
- **Adding hosts:** prefer documenting new first-party or CDN hosts in this file when they become common; the broad pattern is a pragmatic default, not a security boundary for private data.

## Hive `0x0` image proxy (UGC)

Dead or flaky UGC hosts (e.g. legacy **`ipfs.busy.org`**) break feed previews and post body `<img>` tags. At **display** time, wrap remote URLs with Hive’s CDN (legacy Waivio `getProxyImageURL` / `getImagePathPost`):

`https://images.hive.blog/0x0/{originalUrl}`

| Helper | Path |
|--------|------|
| `getProxyImageUrl` / `getImagePathPost` / `stripHiveImageProxyPrefix` | `apps/web/src/shared/infrastructure/image/get-proxy-image-url.ts` (also re-exported from `@/shared/presentation`) |

**Skip proxy** when the URL contains: `waivio.nyc3.digitaloceanspaces` / `nyc3.digitaloceanspaces`, `i.imgur.com`, `sephora.com`, `.avif`, or video poster CDNs (`vumbnail.com`, `i.ytimg.com`, `img.youtube.com` — Hive returns 403). Hive **avatar** paths (`images.hive.blog/u/…`) are left unchanged. Relative `/…` and `data:` URLs are left unchanged.

**Already on `images.hive.blog/{W}x{H}/…` or `/p/…`:** some stored thumbs (e.g. `1280x0/https://ipfs.busy.org/…`) 400 alone but work when wrapped again as `0x0/{fullHiveUrl}`. Direct Hive assets (`/DQm…`, `/u/…` avatars) and standard `0x0/{external}` are left as-is.

**Applied at display (not in query-api payloads):** feed card / grid preview `Image` src, explicit avatar URLs (`resolveAvatarUrl`), post/comment body and feed excerpt HTML (`transformTags.img`, optional `data-fallback-src`), SEO OG / Article JSON-LD remote thumbs. Canonical `thumbnailUrl` from the API stays unproxied so excerpt omit-matching still works.

Base58 Hive `800x600/p/…` preview mode is **not** used here — feed/body historically used `0x0/`; `next/image` handles resize for cards.

## `sizes` and layout

- **Fixed-size avatars:** `sizes={`${size}px`}` or `sizes="36px"` when width/height match the rendered box.
- **Feed preview:** responsive `sizes` reflecting the feed column (e.g. `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw`). Adjust if layout breakpoints change.
- **Cover / hero:** `sizes="100vw"` when the image spans the viewport width of its region.

Use **`fill`** when the visual box is defined by a parent (`relative` + height/aspect); use **explicit `width` / `height`** when the asset renders at a fixed pixel size.

- **Flex parents:** In a row flex, default `align-items: stretch` can stretch a fixed-size avatar vertically. `UserAvatar` uses **`self-start`**, **`shrink-0`**, and inline **`width` / `height` / `minWidth` / `minHeight`** so the box stays square (same idea as a plain `<img>` with explicit pixel dimensions).

## `priority`

- Use **`priority`** only for **above-the-fold** images that matter for LCP (e.g. profile cover on the profile page).
- Do **not** set `priority` on every feed row — that disables lazy loading and hurts performance.

## Fallback and errors

- For components that swap to a placeholder when loading fails (e.g. `UserAvatar`), keep **`onError`** + React state: on error, render the placeholder `Image` (or branch) instead of the remote URL.
- Some hosts (e.g. **`img.3speakcontent.co`**) can fail the optimizer’s **server-side** `fetch` (DNS / network). Use **`shouldUnoptimizeRemoteImage(src)`** from `@/shared/presentation` and pass **`unoptimized`** to `Image` for those URLs so the browser loads the asset directly; pair with **`onError`** where a visible fallback is needed (e.g. feed preview media).

## Markdown content

When post bodies are rendered as Markdown/HTML, use normal **`<img>`** tags with **`loading="lazy"`** unless there is a dedicated pipeline that supplies dimensions and a single remote policy. Do not block Markdown on the default image optimizer. Body/excerpt pipelines rewrite remote `img` `src` through the [Hive `0x0` image proxy](#hive-0x0-image-proxy-ugc) before render.

## IPFS object images (CID)

Object `image` / `imageBackground` / gallery fields may store `{ cid }` (upload via ipfs-gateway). Display URLs are built as:

`{IPFS_CONTENT_BASE_URL}/ipfs-gateway/content/image/{cid}`

| Variable | Service | When read |
|----------|---------|-----------|
| `IPFS_CONTENT_BASE_URL` | query-api, web | **Runtime** (container / `nx serve` env) — same value on a stack; web server actions use it for uploads via nginx |

Runtime configuration only — see [web conventions — Env config](web-conventions.md#runtime-vs-build-ghcr--compose). The root layout reads `IPFS_CONTENT_BASE_URL` and passes it to client UI via `IpfsContentBaseProvider` / `useIpfsContentBaseUrl()`.

Upload (`POST /ipfs-gateway/upload/image`, `/upload/file`) is proxied at **`/ipfs-gateway/`** through nginx and requires **`Authorization: Bearer`** (access JWT, same `JWT_SECRET` as auth-api). Server actions read `odl_access` and forward the token.

**Code:** `get-ipfs-content-base-url.ts`, `get-ipfs-gateway-server-base-url.ts`, `get-bearer-access-token.server.ts`, `upload-image.action.ts`.

### Client-side image editor (before upload)

For `image` (avatar), `imageBackground`, and `imageGalleryItem` fields, picking a file or pasting a URL opens an **inline editor** in `ImageCidOrUrlForm` before IPFS upload:

| Update type | Crop aspect | Max export |
|-------------|-------------|------------|
| `image` | **1:1** (square avatar) | 1024 px |
| `imageBackground` | Natural / free | 1920 px |
| `imageGalleryItem` | Natural / free | 1920 px |

Tools: zoom, fit (reset framing), rotate (+90°), mirror (horizontal). Letterboxing uses a neutral background when the image does not fill the crop frame (e.g. book covers). **Save** exports WebP client-side, then uploads via the existing `upload-image.action.ts` flow. Stored value remains `{ cid }` only.

**Code:** `shared/presentation/components/image-editor/`, `image-editor-config.ts`, `image-cid-or-url-form.tsx`.

## Verification

| Command | Purpose |
|---------|---------|
| `pnpm nx lint web` | ESLint |
| `pnpm nx build web` | Ensures `Image` src domains match `remotePatterns` |
