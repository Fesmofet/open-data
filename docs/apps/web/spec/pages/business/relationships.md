---
id: web-business-relationships
title: Business — relationships & ledger
description: Counterparty list, balance cards, contract and invoice tabs.
type: spec
status: active
scope: web
tags: [web, business, relationships]
updated_at: 2026-07-23
related:
  - docs/apps/web/spec/pages/business/overview.md
  - docs/spec/obl/mutual-ledger.md
---

# Business — relationships & ledger

**Back:** [Business overview](overview.md)

## List (`/business/relationships`)

`GET /query/v1/obl/relationships?account=&limit=&offset=` — paginated `{ items, hasMore }`; infinite scroll on the client.

Each row shows the **confirmed** balance summary (`DirectionalUsd`). When confirmed net is settled (zero) but the **pending** bucket is non-zero, a second caption line shows the pending amount and direction (e.g. settled + “Pending: you owe @counterparty $10.00”).

## Detail (`/business/relationships/:account`)

- Balance from `GET /query/v1/obl/balance`; tab lists load from `GET /query/v1/obl/ledger/{payments|contracts|invoices|disputes}` with cursor pagination and infinite scroll (only the active tab is fetched initially; other tabs lazy-load on first visit).
- Tabs (default **Payments**): Payments, Contracts, Invoices, Disputes — no Overview tab.
- Tab selection is URL-synced via `?tab=payments|contracts|invoices|disputes` (default omits query). Example: `/business/relationships/flowmaster?tab=invoices`.
- All tab lists are ordered **newest first** by `created_at` (API + client sort).
- Broadcast errors shown below balance cards on all tabs.
- Header actions open modals (no inline forms on tabs):
  - **Create invoice** — `BusinessIssueInvoiceModal`: issuer fixed to viewer; **Simple** mode — debtor/creditor default to counterparty → viewer with swap control; **Split payment** mode — debtor limited to contract parties (swap debtor ↔ issuer), beneficiaries via user search (`UserRefSearchField`, placeholder `@username`), one or more lines (`beneficiary`, amount USD, optional `role` on second row), running total; attestor invoices (issuer not debtor/beneficiary) require governing contract; when issuer is also a beneficiary, a warning explains that other recipients stay pending without per-pair contracts, and submit opens a **confirm** step with per-line expected status (`confirmed` / `pending`) plus acknowledgment before broadcast; amount USD; supporting-info JSON optional. Client ids: UUID.
  - **Record payment** — `BusinessDeclarePaymentModal`: payer/receiver default to viewer → counterparty with a swap control between account names. Default path broadcasts `payment_declare` (pending). When swapped so viewer is receiver, shows an offchain receipt warning and broadcasts receiver-only `payment_confirm` (confirmed immediately). Optional payment reference JSON is supported on both paths (`ref` on declare; `ref` on receiver-only confirm is stored with `receiver_only_confirm`).
- **Confirm payment** — receiver clicks a pending off-chain declare row on the Payments tab → `BusinessConfirmPaymentModal` (declared amount pre-filled, editable for partial confirm; `declarePaymentId` on broadcast). No standalone “confirm without declare” control.
- **Payments tab** — `RelationshipPaymentRow` uses wallet history shell (`WalletHistoryRowShell` + `WaivWalletAmount` / `WalletDualAmount`): outgoing (viewer is payer) red with `-`, incoming green with `+`; amount formatting via `formatWalletHistoryQuantity` (same rules as WAIV history). When `declared_amount_usd !== amount_usd` (partial confirm), declared amount shown in neutral/black and confirmed amount with sign/color. Optional `ref` note (`note` / `memo` / `report`) shown under the row; `upvote_reward` rows with `ref.authorperm` link to the rewarded post.
- **Dispute invoice** — disputable invoice rows show **Dispute** → `BusinessOpenDisputeModal`. For multi-beneficiary invoices the modal loads invoice `lines[]` before submit; proposed amount is locked to the invoice total. After indexing, invoice state is `disputed` and appears in the Disputed balance card.
- **Contracts tab** — cards with offer name, description (truncated to 300 chars), `contract_id`, `created_at`; link to contract detail.
- **Invoices tab** — each row shows linked contract (offer name · id) as a link to contract detail; `invoice_id` links to invoice detail; `created_at`, state badge.
- **Disputes tab** — lists disputes with `created_at`; `dispute_id` and `invoice_id` link to detail pages; contract (via linked invoice) links to contract detail when present; open disputes show **Resolve dispute** for the authorized resolver per contract `dispute_rule` → `BusinessResolveDisputeModal` → `dispute_resolve`. Multi-beneficiary invoices: modal fetches invoice `lines[]`; resolver chooses **Accept all** (`final_amount_usd` = total) or **Reject all** (`0`); single-line invoices keep editable final amount.

## Invoice (`/business/invoices/:invoiceId`)

`GET /query/v1/obl/invoices/:invoiceId` — parties, amounts, state, optional contract summary, relationship links.

## Dispute (`/business/disputes/:disputeId`)

`GET /query/v1/obl/disputes/:disputeId` — status, settlement summary, links to invoice and contract.

## Contract (`/business/contracts/:contractId`)

`GET /query/v1/obl/contracts/:contractId` — offer name/description when present, offer link, contract id, provider/client, dispute rule, arbiter (when set), created_at, transaction id, metadata.
