import { Injectable } from '@nestjs/common';

import { normalizeHiveAccount } from '../../auth';
import { OblRepository } from '../../repositories/obl.repository';
import type { CursorPage } from './obl-pagination';
import {
  serializeOblContract,
  serializeOblDispute,
  serializeOblInvoice,
} from './obl-row-serialize';
import type { ListOblArbitrationQuery } from './obl.schemas';

export type ArbitrationDisputeRow = {
  dispute: ReturnType<typeof serializeOblDispute>;
  invoice: ReturnType<typeof serializeOblInvoice>;
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
    return {
      items: page.items.map((row) => ({
        dispute: serializeOblDispute(row.dispute),
        invoice: serializeOblInvoice(row.invoice),
        contract: serializeOblContract(row.contract, row.offer_name),
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
