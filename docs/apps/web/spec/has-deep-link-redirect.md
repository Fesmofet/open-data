---
id: docs-apps-web-spec-has-deep-link-redirect
title: HAS deep-link redirect page
description: Public /has route opens Hive Keychain Mobile from https links in chat messengers via has://auth_req fragment payload.
type: spec
status: active
scope: web
tags: [web, has, hiveauth, keychain, redirect]
updated_at: 2026-08-12
related:
  - docs/skills/has-login-from-chat.md
  - docs/apps/web/spec/routing-proxy.md
  - docs/apps/web/spec/overview.md
---

# HAS deep-link redirect page

Public route **`/has`** converts a click on an `https://` link (e.g. in Telegram) into `has://auth_req/{base64}` so Hive Keychain Mobile can open.

## URL shape

```
https://<origin>/has#<auth_payload_base64>
```

- **Fragment only** — everything after `#` stays in the browser; nginx/Next never log `auth_key`.
- Payload JSON keys: `account`, `uuid`, `key`, `host` (`wss://…` HAS server).
- Built by `agent-wallet` `has_login_start` as `webLink` (default origin `https://waiviodev.com`).

## Page behavior

Route: `apps/web/src/app/(public)/has/page.tsx` → client `HasRedirectPanel`.

1. Parse and validate fragment (`parseHasAuthFragmentPayload`).
2. Show **Open Keychain** button → `window.location.href = has://auth_req/...` (primary path — required for Telegram in-app browser).
3. Show copyable `has://` string + hint to open in Safari/Chrome if needed.
4. No server API calls; no auth cookies required.

## Proxy / REQUIRE_AUTH

`REQUIRE_AUTH=true` (waiviodev) redirects anonymous users to `/sign-in` except excluded prefixes. **`/has` is excluded** in `apps/web/src/proxy.ts` so HAS login links work without a Waivio session.

## Verification

```bash
pnpm nx test web --testPathPatterns="has-fragment|proxy"
pnpm check:web-i18n-utf8
```

Manual: open `https://<origin>/has#<valid-base64>` on phone → tap Open Keychain → Keychain Mobile auth prompt.

## Related code

| Path | Role |
|------|------|
| `apps/web/src/modules/auth/infrastructure/providers/has/has-fragment-payload.ts` | Parse/validate fragment |
| `apps/web/src/modules/auth/presentation/components/has-redirect-panel.tsx` | UI |
| `apps/web/src/proxy.ts` | `/has` auth exclusion |
