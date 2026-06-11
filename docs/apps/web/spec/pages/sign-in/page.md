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

- Centered card with heading and `LoginWall` from `@/modules/auth`.
- Wallet providers (Keychain, HiveSigner, HiveAuth) — see [auth.md](../../auth.md).

## SEO

`generateMetadata` → `buildSignInMetadata` with request locale and i18n messages.

## Verification

Manual: open `/sign-in` logged out; complete Keychain login and confirm redirect + httpOnly cookies via auth BFF.
