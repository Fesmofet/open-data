---
id: web-business-relationships
title: Business — relationships & ledger
description: Counterparty list, balance cards, contract and invoice tabs.
type: spec
status: active
scope: web
tags: [web, business, relationships]
updated_at: 2026-07-16
related:
  - docs/apps/web/spec/pages/business/overview.md
  - docs/spec/obl/mutual-ledger.md
---

# Business — relationships & ledger

**Back:** [Business overview](overview.md)

## List (`/business/relationships`)

`GET /query/v1/obl/relationships?account=` — counterparty, roles, contract count, pair balance.

## Detail (`/business/relationships/:account`)

- Three balance cards: Confirmed, Pending, Disputed (`BalanceCards` + `DirectionalUsd`). Buckets match [`mutual-ledger.md`](../../../../spec/obl/mutual-ledger.md): `payment_declare` → pending payments; `payment_confirm` → confirmed; disputed invoices → disputed bucket only.
- Tabs (default **Payments**): Payments, Contracts, Invoices, Disputes — no Overview tab.
- All tab lists are ordered **newest first** by `created_at` (API + client sort).
- Broadcast errors shown below balance cards on all tabs.
- Header actions open modals (no inline forms on tabs):
  - **Create invoice** — `BusinessIssueInvoiceModal`: issuer fixed to viewer; debtor/creditor default to counterparty → viewer (they owe you) with a horizontal swap control between account names to flip roles; contract `<select>` from pair contracts (offer name + short id); amount USD; supporting-info JSON is optional hint-only (empty field → omitted from broadcast, no `{}`). Client ids: UUID.
  - **Record payment** — `BusinessDeclarePaymentModal`: payer/receiver default to viewer → counterparty with a swap control between account names. Default path broadcasts `payment_declare` (pending). When swapped so viewer is receiver, shows an offchain receipt warning and broadcasts receiver-only `payment_confirm` (confirmed immediately). Optional payment reference JSON is supported on both paths (`ref` on declare; `ref` on receiver-only confirm is stored with `receiver_only_confirm`).
- **Confirm payment** — receiver clicks a pending off-chain declare row on the Payments tab → `BusinessConfirmPaymentModal` (declared amount pre-filled, editable for partial confirm; `declarePaymentId` on broadcast). No standalone “confirm without declare” control.
- **Payments tab** — `RelationshipPaymentRow` uses wallet history shell (`WalletHistoryRowShell` + `WaivWalletAmount` / `WalletDualAmount`): outgoing (viewer is payer) red with `-`, incoming green with `+`; amount formatting via `formatWalletHistoryQuantity` (same rules as WAIV history). When `declared_amount_usd !== amount_usd` (partial confirm), declared amount shown in neutral/black and confirmed amount with sign/color. Optional `ref` note (`note` / `memo` / `report`) shown under the row; `upvote_reward` rows with `ref.authorperm` link to the rewarded post.
- **Dispute invoice** — disputable invoice rows show **Dispute** → `BusinessOpenDisputeModal`. After indexing, invoice state is `disputed` and appears in the Disputed balance card.
- **Contracts tab** — cards with offer name, description (truncated to 300 chars), `contract_id`, `created_at`; link to contract detail.
- **Invoices tab** — each row shows linked contract (offer name · id), `created_at`, state badge.
- **Disputes tab** — lists disputes with `created_at`; open disputes show **Resolve dispute** for the authorized resolver per contract `dispute_rule` → `BusinessResolveDisputeModal` → `dispute_resolve`.

## Contract (`/business/contracts/:contractId`)

`GET /query/v1/obl/contracts/:contractId` — offer link, provider/client, dispute rule.
