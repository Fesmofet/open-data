---
id: web-pages-user-profile-routes-engine-wallet-operations
title: ENGINE wallet operations (web)
description: Owner sidebar swap/deposit/withdraw on the transfers tab; center column read-only summaries.
type: spec
status: active
scope: web
tags: [web, page, user-profile, wallet, engine]
updated_at: 2026-07-08
related:
  - docs/apps/web/spec/pages/user-profile/routes/transfers.md
  - docs/apps/web/spec/pages/user-profile/routes/currency-market-widget.md
  - docs/apps/query-api/spec/user-engine-swap-endpoints.md
---

# ENGINE wallet operations (web)

Transfers tab owner actions live in the profile **right sidebar** when viewing `/@name/transfers`.

## Right rail layout (desktop `lg+`)

The sidebar is split into three vertical blocks (legacy parity):

| Block | Component | Who sees it | Tabs |
|-------|-----------|-------------|------|
| Top actions | `WalletActionsSidebarTop` | Profile owner | All wallet tabs |
| Market | `CryptoMarketPanel` | All viewers | All wallet tabs |
| Bottom actions | `WalletActionsSidebarBottom` | Profile owner | **WAIV** and **ENGINE** only (hidden on **HIVE**) |

### Top group (owner, all tabs)

- Transfer (primary)
- Power up / Power down
- Manage delegations

### Market (all viewers)

See [currency-market-widget.md](currency-market-widget.md).

### Bottom group (owner, WAIV / ENGINE only)

- Swap tokens (primary) — opens swap modal with `fromSymbol: WAIV`
- Deposit / Withdraw

## WAIV row actions

On the WAIV tab, each token row still exposes **Transfer** and a withdraw submenu (LTC/BTC/ETH/HIVE/HBD) that opens the withdraw modal with the matching pair preset. When the owner sidebar is visible (desktop), inline row actions are hidden to avoid duplicates.

## Modals

Shared modal context: `ProfileMainWalletModalShell` in `(main)/layout.tsx` wraps sidebar + center column. `TransfersWalletPageClient` provides balances and a single `WalletModalsGate`.

- **Transfer / Power / Delegate** — all held HE tokens via asset selector (plus HIVE/HBD/WAIV where applicable).
- **Swap** — `POST .../engine/swap/quote` (debounced, stale-response safe); honors sidebar `fromSymbol`. USD estimate uses WAIV summary rates prefetched on ENGINE tab too.
- **Deposit** — converter-api routing (`account`, `memo`, or `address`); list refetches on each open. HIVE uses hivepegged buy routing.
- **Withdraw** — `POST .../engine/withdraw/quote` with optional `previewOnly` (no address) for receive preview; server validates min/fee on final leg only. Structured `errorCode` / `errorParams` map to i18n in the web app.

## Layout

Center column summaries are read-only for owners (`hideRowActions` when sidebar visible); sidebar owns primary action triggers on desktop. ENGINE tab summary has no inline row actions (sidebar only).

## Deposit QR

External QR images use `api.qrserver.com` — third-party request; document in privacy/CSP if hardening CSP later.
