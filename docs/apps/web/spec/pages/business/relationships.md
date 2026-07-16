---
id: web-business-relationships
title: Business — relationships & ledger
description: Counterparty list, balance cards, contract and invoice tabs.
type: spec
status: active
scope: web
tags: [web, business, relationships]
updated_at: 2026-07-14
related:
  - docs/apps/web/spec/pages/business/overview.md
  - docs/spec/obl/mutual-ledger.md
---

# Business — relationships & ledger

**Back:** [Business overview](overview.md)

## List (`/business/relationships`)

`GET /query/v1/obl/relationships?account=` — counterparty, roles, contract count, pair balance.

## Detail (`/business/relationships/:account`)

- Three balance cards: Confirmed, Pending, Disputed (`BalanceCards` + `DirectionalUsd`).
- Tabs: Overview, Contracts, Invoices, Payments, Disputes.
- Actions: issue invoice, declare/confirm payment (off-chain OBL ops).

## Contract (`/business/contracts/:contractId`)

`GET /query/v1/obl/contracts/:contractId` — offer link, provider/client, dispute rule.
