import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type {
  NewOblContract,
  NewOblDispute,
  NewOblInvoice,
  NewOblLedger,
  NewOblOffer,
  NewOblPayment,
  OblContract,
  OblDispute,
  OblInvoice,
  OblOffer,
  OblOfferStatus,
  OblPayment,
} from '@opden-data-layer/core';
import type { Database } from '../database';
import { KYSELY } from '../database';

export type DbExecutor = Kysely<Database>;

@Injectable()
export class OblRepository {
  private readonly logger = new Logger(OblRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  executor(trx?: DbExecutor): DbExecutor {
    return trx ?? this.db;
  }

  async runInTransaction<T>(fn: (trx: DbExecutor) => Promise<T>): Promise<T> {
    return this.db.transaction().execute(fn);
  }

  async insertOffer(row: NewOblOffer, trx?: DbExecutor): Promise<void> {
    try {
      await this.executor(trx).insertInto('obl_offers').values(row).execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async findLatestOffer(
    offerId: string,
    trx?: DbExecutor,
  ): Promise<OblOffer | null> {
    try {
      return (
        (await this.executor(trx)
          .selectFrom('obl_offers')
          .where('offer_id', '=', offerId)
          .orderBy('version', 'desc')
          .selectAll()
          .executeTakeFirst()) ?? null
      );
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }

  async findOfferVersion(
    offerId: string,
    version: number,
    trx?: DbExecutor,
  ): Promise<OblOffer | null> {
    try {
      return (
        (await this.executor(trx)
          .selectFrom('obl_offers')
          .where('offer_id', '=', offerId)
          .where('version', '=', version)
          .selectAll()
          .executeTakeFirst()) ?? null
      );
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }

  async updateOfferStatus(
    offerId: string,
    version: number,
    status: OblOfferStatus,
    trx?: DbExecutor,
  ): Promise<void> {
    try {
      await this.executor(trx)
        .updateTable('obl_offers')
        .set({ status })
        .where('offer_id', '=', offerId)
        .where('version', '=', version)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async retireAllOfferVersions(offerId: string, trx?: DbExecutor): Promise<void> {
    try {
      await this.executor(trx)
        .updateTable('obl_offers')
        .set({ status: 'retired' })
        .where('offer_id', '=', offerId)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async insertContract(row: NewOblContract, trx?: DbExecutor): Promise<void> {
    try {
      await this.executor(trx).insertInto('obl_contracts').values(row).execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async findContract(
    contractId: string,
    trx?: DbExecutor,
  ): Promise<OblContract | null> {
    try {
      return (
        (await this.executor(trx)
          .selectFrom('obl_contracts')
          .where('contract_id', '=', contractId)
          .selectAll()
          .executeTakeFirst()) ?? null
      );
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }

  async hasLedgerForPair(
    pairLow: string,
    pairHigh: string,
    trx?: DbExecutor,
  ): Promise<boolean> {
    try {
      const row = await this.executor(trx)
        .selectFrom('obl_ledgers')
        .where('pair_low', '=', pairLow)
        .where('pair_high', '=', pairHigh)
        .select('pair_low')
        .executeTakeFirst();
      if (row) return true;
      const contract = await this.executor(trx)
        .selectFrom('obl_contracts')
        .where('pair_low', '=', pairLow)
        .where('pair_high', '=', pairHigh)
        .select('contract_id')
        .limit(1)
        .executeTakeFirst();
      return contract !== undefined;
    } catch (e) {
      this.logger.error((e as Error).message);
      return false;
    }
  }

  async insertLedger(row: NewOblLedger, trx?: DbExecutor): Promise<void> {
    try {
      await this.executor(trx)
        .insertInto('obl_ledgers')
        .values(row)
        .onConflict((oc) => oc.columns(['pair_low', 'pair_high']).doNothing())
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async findLedgerStartedSeq(
    pairLow: string,
    pairHigh: string,
    trx?: DbExecutor,
  ): Promise<bigint | null> {
    try {
      const ledger = await this.executor(trx)
        .selectFrom('obl_ledgers')
        .where('pair_low', '=', pairLow)
        .where('pair_high', '=', pairHigh)
        .select('started_event_seq')
        .executeTakeFirst();
      if (ledger) return ledger.started_event_seq;
      const contract = await this.executor(trx)
        .selectFrom('obl_contracts')
        .where('pair_low', '=', pairLow)
        .where('pair_high', '=', pairHigh)
        .orderBy('created_event_seq', 'asc')
        .select('created_event_seq')
        .executeTakeFirst();
      return contract?.created_event_seq ?? null;
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }

  async insertInvoice(row: NewOblInvoice, trx?: DbExecutor): Promise<void> {
    try {
      await this.executor(trx).insertInto('obl_invoices').values(row).execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async findInvoice(
    invoiceId: string,
    trx?: DbExecutor,
  ): Promise<OblInvoice | null> {
    try {
      return (
        (await this.executor(trx)
          .selectFrom('obl_invoices')
          .where('invoice_id', '=', invoiceId)
          .selectAll()
          .executeTakeFirst()) ?? null
      );
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }

  async updateInvoice(
    invoiceId: string,
    patch: {
      state?: OblInvoice['state'];
      final_amount_usd?: string | null;
    },
    trx?: DbExecutor,
  ): Promise<void> {
    try {
      await this.executor(trx)
        .updateTable('obl_invoices')
        .set(patch)
        .where('invoice_id', '=', invoiceId)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async promotePendingInvoicesForPair(
    pairLow: string,
    pairHigh: string,
    trx?: DbExecutor,
  ): Promise<void> {
    try {
      await this.executor(trx)
        .updateTable('obl_invoices')
        .set({ state: 'confirmed' })
        .where('pair_low', '=', pairLow)
        .where('pair_high', '=', pairHigh)
        .where('state', '=', 'pending')
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async insertPayment(row: NewOblPayment, trx?: DbExecutor): Promise<void> {
    try {
      await this.executor(trx).insertInto('obl_payments').values(row).execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async findPayment(
    paymentId: string,
    trx?: DbExecutor,
  ): Promise<OblPayment | null> {
    try {
      return (
        (await this.executor(trx)
          .selectFrom('obl_payments')
          .where('payment_id', '=', paymentId)
          .selectAll()
          .executeTakeFirst()) ?? null
      );
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }

  async updatePayment(
    paymentId: string,
    patch: { state?: OblPayment['state']; amount_usd?: string },
    trx?: DbExecutor,
  ): Promise<void> {
    try {
      await this.executor(trx)
        .updateTable('obl_payments')
        .set(patch)
        .where('payment_id', '=', paymentId)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async insertDispute(row: NewOblDispute, trx?: DbExecutor): Promise<void> {
    try {
      await this.executor(trx).insertInto('obl_disputes').values(row).execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async findDispute(
    disputeId: string,
    trx?: DbExecutor,
  ): Promise<OblDispute | null> {
    try {
      return (
        (await this.executor(trx)
          .selectFrom('obl_disputes')
          .where('dispute_id', '=', disputeId)
          .selectAll()
          .executeTakeFirst()) ?? null
      );
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }

  async findOpenDisputeForInvoice(
    invoiceId: string,
    trx?: DbExecutor,
  ): Promise<OblDispute | null> {
    try {
      return (
        (await this.executor(trx)
          .selectFrom('obl_disputes')
          .where('invoice_id', '=', invoiceId)
          .where('status', '=', 'open')
          .selectAll()
          .executeTakeFirst()) ?? null
      );
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }

  async resolveDispute(
    disputeId: string,
    patch: {
      final_amount_usd: string;
      resolver: string;
      resolved_event_seq: bigint;
    },
    trx?: DbExecutor,
  ): Promise<void> {
    try {
      await this.executor(trx)
        .updateTable('obl_disputes')
        .set({ ...patch, status: 'resolved' })
        .where('dispute_id', '=', disputeId)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }
}
