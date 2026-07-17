---
id: docs-skills-obl-disputes
title: OBL disputes and arbitration
description: Open and resolve OBL invoice disputes, apply dispute_rule and arbiter, and read the arbitration inbox.
type: skill
status: active
scope: platform
tags: [obl, disputes, arbitration, dispute_resolve, dispute_open, arbiter, business]
updated_at: 2026-07-17
related:
  - docs/skills/obl-offers-contracts.md
  - docs/skills/obl-ledger.md
  - docs/skills/hive-blockchain-broadcast.md
  - docs/skills/query-api-mcp-routing.md
  - docs/skills/knowledge-api-routing.md
  - docs/spec/open-business-layer.md
  - docs/spec/obl/disputes.md
  - docs/apps/query-api/spec/obl.md
---

# OBL disputes and arbitration

Open and resolve disputes on Mutual Ledger invoices; read the arbiter inbox.

**Signing / broadcast:** [Hive blockchain broadcast](hive-blockchain-broadcast.md). Use `buildObl*` + `obl-mainnet` / `obl-testnet`.

## When to use

- Open a dispute on an invoice (`dispute_open` / `buildOblDisputeOpenOp`).
- Resolve a dispute as the authorized party (`dispute_resolve` / `buildOblDisputeResolveOp`).
- List disputes for a pair or the **arbitration** inbox for an arbiter account.

## When not to use

- Publish/sign offers and contracts — [obl-offers-contracts.md](obl-offers-contracts.md).
- Issue invoices or payments without a dispute — [obl-ledger.md](obl-ledger.md).
- Normative authority rules — [docs/spec/obl/disputes.md](../spec/obl/disputes.md).

## Cycle position

[Contract + invoice](obl-offers-contracts.md) / [ledger](obl-ledger.md) → **dispute open / resolve** → balance disputed/resolved buckets update.

## Network

| Network | Id |
|---------|-----|
| Mainnet | `obl-mainnet` |
| Testnet | `obl-testnet` |

## Who may resolve

Authority comes from the invoice’s linked contract:

| `dispute_rule` | Resolver |
|----------------|----------|
| `client` | Contract `client` |
| `provider` | Contract `provider` |
| `arbiter` | Contract `arbiter` account |

If the invoice has no contract, fall back carefully — prefer linking invoices to contracts at issue time. See [disputes.md](../spec/obl/disputes.md).

## Read (query-api MCP)

| Intent | Tool |
|--------|------|
| Arbiter inbox | `get_obl_arbitration` (`status`: `open` \| `resolved`) |
| Pair ledger (includes disputes) | `get_obl_ledger` |
| Contract (`dispute_rule`, `arbiter`) | `get_obl_contract` |

HTTP: `GET /query/v1/obl/disputes/:disputeId`, ledger disputes cursor page. [query-api OBL](../apps/query-api/spec/obl.md) · [query-api MCP routing](query-api-mcp-routing.md).

## Steps — open dispute

1. Invoice must be disputable (typically `confirmed` / `pending`, no open dispute).
2. Disputant is debtor or creditor; proposed amount USD.
3. Client id: `dispute-{uuid}` (or project convention).
4. Build and broadcast:

```ts
import { buildOblDisputeOpenOp } from '@opden-data-layer/hive-broadcast';

const op = buildOblDisputeOpenOp({
  id: 'obl-mainnet',
  disputeId: 'dispute-…',
  invoiceId: 'inv-…',
  disputant: 'bob',
  proposedAmountUsd: '80.00',
});
```

5. After index: invoice → `disputed`; amount moves into disputed balance bucket ([mutual-ledger](../spec/obl/mutual-ledger.md)).

## Steps — resolve dispute

1. Load dispute + invoice + contract; confirm viewer === resolver for `dispute_rule`.
2. Set `finalAmountUsd` (settlement).
3. Broadcast:

```ts
import { buildOblDisputeResolveOp } from '@opden-data-layer/hive-broadcast';

const op = buildOblDisputeResolveOp({
  id: 'obl-mainnet',
  disputeId: 'dispute-…',
  resolver: 'judge',
  finalAmountUsd: '85.00',
});
```

4. After index: dispute `resolved`, invoice `resolved` with `final_amount_usd`; disputed bucket clears.

## Steps — arbitration inbox

1. For an arbiter account: `get_obl_arbitration({ account, status: 'open' })`.
2. Each row includes dispute, invoice, contract summary, offer name.
3. Resolve with `buildOblDisputeResolveOp` when `dispute_rule === 'arbiter'` and `arbiter === account`.

## Gotchas

- Only one **open** dispute per invoice.
- Resolver must match contract rule — wrong account fails validation on index.
- Open disputes affect the **disputed** balance card; do not treat them as confirmed debt.
- Prefer `get_obl_contract` before resolve so `arbiter` / rule are not guessed.

## Verification

- Body of this skill contains `buildOblDisputeOpenOp` and `get_obl_arbitration`.
- After open/resolve + index: dispute status and invoice state match; arbitration list updates for arbiter.
- `resolve_doc({ topic: "resolve obl dispute" })` routes here.

## Related

- [OBL offers and contracts](obl-offers-contracts.md) · [OBL ledger](obl-ledger.md)
- [Disputes spec](../spec/obl/disputes.md) · [Open Business Layer](../spec/open-business-layer.md)
- [Hive blockchain broadcast](hive-blockchain-broadcast.md)
