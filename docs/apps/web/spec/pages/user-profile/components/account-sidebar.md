---
id: web-pages-user-profile-account-sidebar
title: Profile account sidebar
description: Left-rail account panel on default profile routes (legacy UserInfo parity).
type: spec
status: active
scope: web
tags: [web, page, user-profile, sidebar]
updated_at: 2026-07-09
related:
  - docs/apps/web/spec/pages/user-profile/profile-shell.md
  - docs/apps/web/spec/pages/user-profile/data-loading.md
  - docs/apps/query-api/spec/users-account-sidebar.md
---

# Profile account sidebar

**Back:** [profile-shell](../profile-shell.md)

## When shown

**Desktop (`lg+`):** `@leftSidebar` default routes (`page.tsx`, `[...slug]/page.tsx`, `default.tsx`) — feed, followers, transfers, activity, expertise, etc.

**Mobile (below `lg`):** left rail hidden. A compact subset of sidebar fields is rendered in the profile hero via `UserProfileMobileHeroMeta` and `UserProfileMobileHeroDetails` (rank, vote value, bio, location, website, active). Full sidebar data still comes from `getUserAccountSidebarQuery` (React `cache()` dedupes hero + `@leftSidebar` fetches).

**Not** shown on shop/recipe/favorites left-rail pages (those keep `CategoryNav` / `FavoritesTypeNav`).

## Component

| Piece | Path |
|-------|------|
| Server fetch | `getUserAccountSidebarQuery` in `@/modules/user-profile` |
| UI | `ProfileAccountSidebar` (client; i18n + external link modal) |
| Crypto QR modal | `ProfileCryptoWalletModal` — address, copy, amount, USD estimate, QR via `qrserver.com` |
| Crypto prices BFF | `GET /api/currency/crypto-prices` — CoinGecko proxy for BTC/ETH/LTC (Lightning uses `bitcoin` rate) |
| Loading | `ProfileLeftRailSkeleton` in `@leftSidebar/loading.tsx` |

## Data

`GET /query/v1/users/:name/account-sidebar` — see [query-api spec](../../../../query-api/spec/users-account-sidebar.md).

Cache tag: `query-api:user:{name}:account-sidebar` (invalidated on social + wallet broadcasts).

## Regions (legacy parity)

- About, location, website (external link confirm), email
- Joined, expertise weight, active (relative time), total vote value
- Social profile links from `posting_json_metadata.profile` (legacy `SocialLinks`) with platform icons
- Transfer shortcuts: **WAIV, HIVE, HBD** (intentional WAIV-first order; legacy was HIVE/HBD only) — opens viewer wallet transfer modal with recipient locked to profile account
- Crypto deposit addresses (BTC, LTC, ETH, Lightning) when set on profile — opens `ProfileCryptoWalletModal` (legacy `WalletAddressModal` parity; QR scheme `lightning bitcoin:...` for Lightning)
- WAIV token block: up/down mana, WAIV vote USD
- HIVE token block: Hive reputation, up/down mana, RC %, HIVE vote USD
