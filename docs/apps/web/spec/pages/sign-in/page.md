---
id: web-pages-sign-in-page
title: Sign in page
description: Public login wall at `/sign-in` for unauthenticated visitors (e.g. after proxy redirect). Uses the `(public)` route group — no app shell chrome.
type: spec
status: active
scope: web
tags: [web, page, sign-in, auth]
updated_at: 2026-06-10
related:
  - docs/apps/web/spec/auth.md
  - docs/apps/web/spec/pages/index.md
  - docs/apps/web/spec/seo.md
---

# Sign in page

**Back:** [pages index](../index.md) · **Related:** [auth.md](../../auth.md), [seo.md](../../seo.md)

## Purpose

Public login wall at `/sign-in` for unauthenticated visitors (e.g. after proxy redirect). Uses the `(public)` route group — no app shell chrome.

## Routes

| Public URL | App Router file |
|------------|-----------------|
| `/sign-in` | `(public)/sign-in/page.tsx` |

## UI

- Centered card with **`SignInCard`**: title “Sign in”, subtitle “Sign in with your Hive account to continue.”, and `LoginWall` (`ProviderList`) from `@/modules/auth`.
- **Hive Keychain (HAS path):** after username submit, `KeychainHasLoginPanel` shows an info callout (Posting + Active keys), numbered steps with inline SVG icons, QR code, an “or” divider, **Open in Hive Keychain** outline button, `AppLoader` while waiting for approval, and Cancel.
- Wallet providers (Keychain, HiveSigner) — see [auth.md](../../auth.md).
- If the visitor already has a valid session, the page server-redirects to `/`.

## Post-login navigation

Keychain/HiveAuth on this wall use a **full document navigation** to `/` (not `router.push` + `router.refresh`) so new httpOnly cookies are visible to the proxy on the next request — same outcome as HiveSigner’s server redirect callback.

## SEO

`generateMetadata` → `buildSignInMetadata` with request locale and i18n messages.

## Verification

Manual: open `/sign-in` logged out; complete Keychain login and confirm redirect + httpOnly cookies via auth BFF.
