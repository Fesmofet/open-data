import { Injectable } from '@nestjs/common';
import type { OblContract, OblDispute, OblInvoice } from '@opden-data-layer/core';

import { normalizeHiveAccount } from '../../auth';
import { OblRepository } from '../../repositories/obl.repository';
import type { CursorPage } from './obl-pagination';
import type { ListOblArbitrationQuery } from './obl.schemas';

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function serializeDispute(row: OblDispute) {
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

function serializeInvoice(row: OblInvoice) {
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

function serializeContract(row: OblContract) {
  return {
    contract_id: row.contract_id,
    offer_id: row.offer_id,
    offer_version: row.offer_version,
    provider: row.provider,
    client: row.client,
    dispute_rule: row.dispute_rule,
    arbiter: row.arbiter,
    metadata: row.metadata,
    created_event_seq: row.created_event_seq.toString(),
    transaction_id: row.transaction_id,
    created_at: toIso(row.created_at),
  };
}

export type ArbitrationDisputeRow = {
  dispute: ReturnType<typeof serializeDispute>;
  invoice: ReturnType<typeof serializeInvoice>;
  contract: ReturnType<typeof serializeContract>;
  offerName: string;
  pair: { provider: string; client: string };
};

@Injectable()
export class OblArbitrationService {
  constructor(private readonly obl: OblRepository) {}

  async listForAccount(
    accountRaw: string,
    query: ListOblArbitrationQuery,
  ): Promise<CursorPage<ArbitrationDisputeRow>> {
    const account = normalizeHiveAccount(accountRaw);
    const page = await this.obl.listArbitrationDisputesForAccount(
      account,
      query.status,
      query.limit,
      query.cursor,
    );
    return {
      items: page.items.map((row) => ({
        dispute: serializeDispute(row.dispute),
        invoice: serializeInvoice(row.invoice),
        contract: serializeContract(row.contract),
        offerName: row.offer_name ?? '',
        pair: {
          provider: row.contract.provider,
          client: row.contract.client,
        },
      })),
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    };
  }
}
