import { BadRequestException, Injectable } from '@nestjs/common';
import type { OblContract, OblDispute, OblInvoice, OblOffer, OblPayment } from '@opden-data-layer/core';
import { normalizeHiveAccount } from '../../auth';
import { OblRepository } from '../../repositories/obl.repository';
import { computePairBalance } from './compute-pair-balance';
import type { SearchOblOffersQuery } from './obl.schemas';

function normalizePair(a: string, b: string): { pairLow: string; pairHigh: string } {
  const x = a.trim();
  const y = b.trim();
  return x <= y ? { pairLow: x, pairHigh: y } : { pairLow: y, pairHigh: x };
}

function filterByLedgerCutoff<T extends { created_event_seq: bigint }>(
  rows: readonly T[],
  startedSeq: bigint | null,
): T[] {
  if (startedSeq === null) {
    return [...rows];
  }
  return rows.filter((row) => row.created_event_seq >= startedSeq);
}

@Injectable()
export class OblOffersService {
  constructor(private readonly obl: OblRepository) {}

  async search(query: SearchOblOffersQuery): Promise<OblOffer[]> {
    return this.obl.searchOffers({
      q: query.q,
      kind: query.kind,
      tags: query.tags,
      author: query.author ? normalizeHiveAccount(query.author) : undefined,
      limit: query.limit,
      offset: query.offset,
    });
  }

  async getOffer(offerId: string, version?: number): Promise<OblOffer | null> {
    return this.obl.findOffer(offerId, version);
  }
}

@Injectable()
export class OblLedgerService {
  constructor(private readonly obl: OblRepository) {}

  async getLedger(accountA: string, accountB: string): Promise<{
    accountA: string;
    accountB: string;
    startedEventSeq: string | null;
    contracts: OblContract[];
    invoices: OblInvoice[];
    payments: OblPayment[];
    disputes: OblDispute[];
    balance: ReturnType<typeof computePairBalance>;
  }> {
    const normalizedA = normalizeHiveAccount(accountA);
    const normalizedB = normalizeHiveAccount(accountB);
    if (normalizedA === normalizedB) {
      throw new BadRequestException('accountA and accountB must differ');
    }

    const { pairLow, pairHigh } = normalizePair(normalizedA, normalizedB);
    const startedSeq = await this.obl.findLedgerStartedSeq(pairLow, pairHigh);

    const [contracts, allInvoices, allPayments] = await Promise.all([
      this.obl.listContractsForPair(pairLow, pairHigh),
      this.obl.listInvoicesForPair(pairLow, pairHigh),
      this.obl.listPaymentsForPair(pairLow, pairHigh),
    ]);

    const invoices = filterByLedgerCutoff(allInvoices, startedSeq);
    const payments = filterByLedgerCutoff(allPayments, startedSeq);

    const disputes = await this.obl.listDisputesForInvoices(
      invoices.map((inv) => inv.invoice_id),
    );

    const balance = computePairBalance(
      normalizedA,
      normalizedB,
      invoices.map((inv) => ({
        debtor: inv.debtor,
        creditor: inv.creditor,
        amount_usd: String(inv.amount_usd),
        final_amount_usd:
          inv.final_amount_usd !== null && inv.final_amount_usd !== undefined
            ? String(inv.final_amount_usd)
            : null,
        state: inv.state,
      })),
      payments.map((pay) => ({
        payer: pay.payer,
        receiver: pay.receiver,
        amount_usd: String(pay.amount_usd),
        state: pay.state,
      })),
    );

    return {
      accountA: normalizedA,
      accountB: normalizedB,
      startedEventSeq: startedSeq !== null ? startedSeq.toString() : null,
      contracts,
      invoices,
      payments,
      disputes,
      balance,
    };
  }
}
