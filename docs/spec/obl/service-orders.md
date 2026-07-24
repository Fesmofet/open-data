# OBL service orders

Immutable records that reference a **signed contract** between provider and client. They do not move balances; they document work or scope before invoices and reports.

## On-chain

- **Action:** `service_order_create`
- **Payload:** `service_order_id`, `contract_id`, `creator`, optional `details` (JSON object)
- **Signer:** `creator` must be in `required_posting_auths`
- **Rules:** `creator` must be the contract `provider` or `client`

## Storage

Table `obl_service_orders` (see migration `00045_obl_service_orders_reports.ts`). Denormalized `provider` / `client` and generated `pair_low` / `pair_high` for pair-scoped listing.

## Query API

| Method | Path |
|--------|------|
| GET | `/query/v1/obl/service-orders/:serviceOrderId` |
| GET | `/query/v1/obl/ledger/service-orders?accountA&accountB` |

## Web

Relationship detail tabs **Service orders** and actions **Create service order**. When the contract has `service_order_schema`, the create modal pre-fills **Object Builder** fields as a recommendation (editable). Detail route `/business/service-orders/:id`.

## Related

- [Contracts](./contracts.md)
- [Reports](./reports.md)
- [Relationships](./relationships.md)
