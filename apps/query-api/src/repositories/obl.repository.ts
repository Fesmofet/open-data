import { Injectable, Inject } from '@nestjs/common';
import { sql, type Kysely } from 'kysely';
import type {
  NewOblOfferDraft,
  OblContract,
  OblDispute,
  OblInvoice,
  OblOffer,
  OblOfferDraft,
  OblOfferDraftUpdate,
  OblPayment,
} from '@opden-data-layer/core';
import type { Database } from '../database';
import { KYSELY } from '../database';

function jsonForJsonb(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) {
    return {};
  }
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

@Injectable()
export class OblRepository {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async searchOffers(input: {
    q?: string;
    kind?: 'offer' | 'request';
    tags?: string[];
    author?: string;
    limit: number;
    offset: number;
  }): Promise<OblOffer[]> {
    let latestQb = this.db
      .selectFrom('obl_offers')
      .distinctOn('offer_id')
      .selectAll()
      .where('status', '=', 'active')
      .orderBy('offer_id')
      .orderBy('version', 'desc');

    if (input.kind) {
      latestQb = latestQb.where('kind', '=', input.kind);
    }
    if (input.author) {
      latestQb = latestQb.where('author', '=', input.author);
    }
    if (input.tags && input.tags.length > 0) {
      latestQb = latestQb.where(sql<boolean>`tags @> ${sql.val(input.tags)}::text[]`);
    }
    const q = input.q?.trim();
    if (q) {
      const pattern = `%${q.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
      latestQb = latestQb.where((eb) =>
        eb.or([
          eb('name', 'ilike', pattern),
          eb('description', 'ilike', pattern),
        ]),
      );
    }

    const latest = latestQb.as('latest_offers');

    return this.db
      .selectFrom(latest)
      .selectAll()
      .orderBy('created_event_seq', 'desc')
      .limit(input.limit)
      .offset(input.offset)
      .execute();
  }

  async findLedgerStartedSeq(
    pairLow: string,
    pairHigh: string,
  ): Promise<bigint | null> {
    const ledger = await this.db
      .selectFrom('obl_ledgers')
      .where('pair_low', '=', pairLow)
      .where('pair_high', '=', pairHigh)
      .select('started_event_seq')
      .executeTakeFirst();
    if (ledger) {
      return ledger.started_event_seq;
    }
    const contract = await this.db
      .selectFrom('obl_contracts')
      .where('pair_low', '=', pairLow)
      .where('pair_high', '=', pairHigh)
      .orderBy('created_event_seq', 'asc')
      .select('created_event_seq')
      .executeTakeFirst();
    return contract?.created_event_seq ?? null;
  }

  async listContractsForPair(pairLow: string, pairHigh: string): Promise<OblContract[]> {
    return this.db
      .selectFrom('obl_contracts')
      .selectAll()
      .where('pair_low', '=', pairLow)
      .where('pair_high', '=', pairHigh)
      .orderBy('created_event_seq', 'asc')
      .execute();
  }

  async listInvoicesForPair(pairLow: string, pairHigh: string): Promise<OblInvoice[]> {
    return this.db
      .selectFrom('obl_invoices')
      .selectAll()
      .where('pair_low', '=', pairLow)
      .where('pair_high', '=', pairHigh)
      .orderBy('created_event_seq', 'asc')
      .execute();
  }

  async listPaymentsForPair(pairLow: string, pairHigh: string): Promise<OblPayment[]> {
    return this.db
      .selectFrom('obl_payments')
      .selectAll()
      .where('pair_low', '=', pairLow)
      .where('pair_high', '=', pairHigh)
      .orderBy('created_event_seq', 'asc')
      .execute();
  }

  async listDisputesForInvoices(invoiceIds: string[]): Promise<OblDispute[]> {
    if (invoiceIds.length === 0) {
      return [];
    }
    return this.db
      .selectFrom('obl_disputes')
      .selectAll()
      .where('invoice_id', 'in', invoiceIds)
      .execute();
  }

  async findOffer(offerId: string, version?: number): Promise<OblOffer | null> {
    let qb = this.db.selectFrom('obl_offers').selectAll().where('offer_id', '=', offerId);
    if (version !== undefined) {
      qb = qb.where('version', '=', version);
    } else {
      qb = qb.orderBy('version', 'desc');
    }
    const row = await qb.executeTakeFirst();
    return row ?? null;
  }

  async findContract(contractId: string): Promise<OblContract | null> {
    const row = await this.db
      .selectFrom('obl_contracts')
      .selectAll()
      .where('contract_id', '=', contractId)
      .executeTakeFirst();
    return row ?? null;
  }

  async listCounterpartiesForAccount(account: string): Promise<string[]> {
    const asProvider = await this.db
      .selectFrom('obl_contracts')
      .select('client')
      .where('provider', '=', account)
      .execute();
    const asClient = await this.db
      .selectFrom('obl_contracts')
      .select('provider')
      .where('client', '=', account)
      .execute();
    const set = new Set<string>();
    for (const row of asProvider) {
      set.add(row.client);
    }
    for (const row of asClient) {
      set.add(row.provider);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  async countContractsForPair(
    pairLow: string,
    pairHigh: string,
    account: string,
  ): Promise<{ total: number; asProvider: number; asClient: number }> {
    const rows = await this.db
      .selectFrom('obl_contracts')
      .select(['provider', 'client'])
      .where('pair_low', '=', pairLow)
      .where('pair_high', '=', pairHigh)
      .execute();
    let asProvider = 0;
    let asClient = 0;
    for (const row of rows) {
      if (row.provider === account) {
        asProvider += 1;
      }
      if (row.client === account) {
        asClient += 1;
      }
    }
    return { total: rows.length, asProvider, asClient };
  }

  async latestContractActivitySeq(
    pairLow: string,
    pairHigh: string,
  ): Promise<bigint | null> {
    const row = await this.db
      .selectFrom('obl_contracts')
      .select('created_event_seq')
      .where('pair_low', '=', pairLow)
      .where('pair_high', '=', pairHigh)
      .orderBy('created_event_seq', 'desc')
      .executeTakeFirst();
    return row?.created_event_seq ?? null;
  }
}

@Injectable()
export class OblOfferDraftsRepository {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async findByAuthorAndDraftId(
    author: string,
    draftId: string,
  ): Promise<OblOfferDraft | null> {
    const row = await this.db
      .selectFrom('obl_offer_drafts')
      .selectAll()
      .where('author', '=', author)
      .where('draft_id', '=', draftId)
      .executeTakeFirst();
    return row ?? null;
  }

  async insert(row: NewOblOfferDraft): Promise<OblOfferDraft> {
    return this.db
      .insertInto('obl_offer_drafts')
      .values({
        ...row,
        fields: sql`${JSON.stringify(jsonForJsonb(row.fields))}::jsonb`,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateByAuthorAndDraftId(
    author: string,
    draftId: string,
    patch: OblOfferDraftUpdate,
  ): Promise<OblOfferDraft | null> {
    const { fields, ...scalarPatch } = patch;
    const setValues: Record<string, unknown> = Object.fromEntries(
      Object.entries(scalarPatch).filter(([, v]) => v !== undefined),
    );
    if (fields !== undefined) {
      setValues.fields = sql`${JSON.stringify(jsonForJsonb(fields))}::jsonb`;
    }
    if (Object.keys(setValues).length === 0) {
      return this.findByAuthorAndDraftId(author, draftId);
    }
    const updated = await this.db
      .updateTable('obl_offer_drafts')
      .set(setValues as OblOfferDraftUpdate)
      .where('author', '=', author)
      .where('draft_id', '=', draftId)
      .returningAll()
      .executeTakeFirst();
    return updated ?? null;
  }

  async deleteByAuthorAndDraftId(author: string, draftId: string): Promise<boolean> {
    const result = await this.db
      .deleteFrom('obl_offer_drafts')
      .where('author', '=', author)
      .where('draft_id', '=', draftId)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }

  async listByAuthor(author: string): Promise<OblOfferDraft[]> {
    return this.db
      .selectFrom('obl_offer_drafts')
      .selectAll()
      .where('author', '=', author)
      .orderBy('last_updated', 'desc')
      .orderBy('draft_id', 'desc')
      .execute();
  }
}
