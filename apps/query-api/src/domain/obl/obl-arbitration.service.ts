import { Injectable } from '@nestjs/common';
import { OblObligationLine } from '@opden-data-layer/odl-db-types';

import { normalizeHiveAccount } from '../../auth';
import { OblRepository } from '../../repositories/obl.repository';

import type { CursorPage } from './obl-pagination';
import { aggregateInvoiceLineView } from './obl-invoice-line';
import {
  serializeOblContract,
  serializeOblDispute,
  serializeOblInvoiceLine,
} from './obl-row-serialize';
import type { ListOblArbitrationQuery } from './obl.schemas';

export type ArbitrationDisputeRow = {
  dispute: ReturnType<typeof serializeOblDispute>;
  invoice: ReturnType<typeof serializeOblInvoiceLine>;
  contract: ReturnType<typeof serializeOblContract>;
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
    const invoiceIds = [...new Set(page.items.map((row) => row.invoice.invoice_id))];
    const allLines = await this.obl.listLinesForInvoices(invoiceIds);
    const linesByInvoice = new Map<string, OblObligationLine[]>();
    for (const line of allLines) {
      const bucket = linesByInvoice.get(line.invoice_id) ?? [];
      bucket.push(line);
      linesByInvoice.set(line.invoice_id, bucket);
    }
    const items = page.items.map((row) => {
      const lines = linesByInvoice.get(row.invoice.invoice_id) ?? [];
      const view = aggregateInvoiceLineView(row.invoice, lines);
      if (!view) {
        throw new Error(`OBL invoice ${row.invoice.invoice_id} has no obligation lines`);
      }
      return {
        dispute: serializeOblDispute(row.dispute),
        invoice: serializeOblInvoiceLine(view),
        contract: serializeOblContract(row.contract, row.offer_name),
        offerName: row.offer_name ?? '',
        pair: {
          provider: row.contract.provider,
          client: row.contract.client,
        },
      };
    });
    return {
      items,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    };
  }
}
