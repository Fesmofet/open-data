# OBL reports

Immutable records authored by a contract party. They may link to a **contract**, a **service order**, or both (at least one required on chain). Informational only — no ledger effect.

## On-chain

- **Action:** `report_create`
- **Payload:** `report_id`, `author`, optional `contract_id`, optional `service_order_id`, optional `details`
- **Signer:** `author` in `required_posting_auths`
- **Rules:** At least one of `contract_id` / `service_order_id`; author must be provider or client of the resolved contract; if both ids are set they must agree on contract

## Storage

Table `obl_reports`. `contract_id` is stored denormalized (from payload or from the linked service order).

## Query API

| Method | Path |
|--------|------|
| GET | `/query/v1/obl/reports/:reportId` |
| GET | `/query/v1/obl/ledger/reports?accountA&accountB` |

## Invoices

`invoice_issue` may include optional `service_order_id` and `report_id`. The indexer validates consistency leniently: mismatches are logged and stored as `null` on the invoice row.

## Web

Relationship **Reports** tab, **Create report**, detail `/business/reports/:id`. Issue-invoice modal optional link fields.

## Related

- [Service orders](./service-orders.md)
- [Contracts](./contracts.md)
