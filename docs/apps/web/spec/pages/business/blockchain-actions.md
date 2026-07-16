---
id: web-business-blockchain-actions
title: Business — blockchain action UX
description: Wallet broadcast, indexing wait, and revalidation for OBL custom_json.
type: spec
status: active
scope: web
tags: [web, business, blockchain]
updated_at: 2026-07-14
related:
  - docs/apps/web/spec/pages/business/overview.md
---

# Business — blockchain action UX

**Back:** [Business overview](overview.md)

## Flow

`useOblBroadcast`: wallet → broadcast → `awaitTrxConfirmation` → `revalidateOblAfterBroadcast` (tags: offers, ledger, relationships).

## Custom JSON id

Client broadcasts use `useOblCustomJsonId()` from `OdlNetworkProvider` (server env `oblCustomJsonId`).

## Phases (`blockchain-action.ts`)

`drafting` → `wallet` → `broadcast` → `indexing` → `confirmed` | `failed`. UI surfaces indexing via `StateBadge` variant `indexing`.

## Builders

`application/build-obl-ops.ts` wraps `@opden-data-layer/hive-broadcast` for publish, update, retire, sign, invoice, payment, dispute ops.
