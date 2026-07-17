import type { OblContract, OblDispute, OblInvoice } from '@opden-data-layer/core';

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function serializeOblDispute(row: OblDispute) {
  return {
    dispute_id: row.dispute_id,
    invoice_id: row.invoice_id,
    disputant: row.disputant,
    proposed_amount_usd: String(row.proposed_amount_usd),
    status: row.status,
    final_amount_usd:
      row.final_amount_usd !== null && row.final_amount_usd !== undefined
        ? String(row.final_amount_usd)
        : null,
    resolver: row.resolver,
    created_event_seq: row.created_event_seq.toString(),
    resolved_event_seq:
      row.resolved_event_seq !== null && row.resolved_event_seq !== undefined
        ? row.resolved_event_seq.toString()
        : null,
    transaction_id: row.transaction_id,
    created_at: toIso(row.created_at),
  };
}

export function serializeOblInvoice(row: OblInvoice) {
  return {
    invoice_id: row.invoice_id,
    contract_id: row.contract_id,
    issuer: row.issuer,
    debtor: row.debtor,
    creditor: row.creditor,
    amount_usd: String(row.amount_usd),
    final_amount_usd:
      row.final_amount_usd !== null && row.final_amount_usd !== undefined
        ? String(row.final_amount_usd)
        : null,
    details: row.details,
    state: row.state,
    created_event_seq: row.created_event_seq.toString(),
    transaction_id: row.transaction_id,
    created_at: toIso(row.created_at),
  };
}

export function serializeOblContract(
  row: OblContract,
  offerName?: string | null,
  offerDescription?: string | null,
) {
  return {
    contract_id: row.contract_id,
    offer_id: row.offer_id,
    offer_version: row.offer_version,
    provider: row.provider,
    client: row.client,
    dispute_rule: row.dispute_rule,
    arbiter: row.arbiter,
    metadata: row.metadata,
    offer_name: offerName ?? null,
    offer_description: offerDescription ?? null,
    created_event_seq: row.created_event_seq.toString(),
    transaction_id: row.transaction_id,
    created_at: toIso(row.created_at),
  };
}
