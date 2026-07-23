import { Injectable, NotFoundException } from '@nestjs/common';
import { normalizeHiveAccount } from '../../auth';
import { OblRepository } from '../../repositories/obl.repository';
import { computePairBalance } from './compute-pair-balance';
import { buildOffsetPage, type OffsetPage } from './obl-pagination';
import {
  serializeOblContract,
  serializeOblDispute,
  serializeOblInvoiceFromHeader,
} from './obl-row-serialize';
import {
  filterByLedgerCutoff,
  normalizePair,
  pairKey,
} from './obl-pair-utils';
import { toBalanceInvoiceRow } from './obl-invoice-line';
import type { ListOblRelationshipsQuery } from './obl.schemas';

export type OblContractSummary = ReturnType<typeof serializeOblContract>;

export type OblInvoiceDetailRow = {
  invoice: ReturnType<typeof serializeOblInvoiceFromHeader>;
  contract: OblContractSummary | null;
};

export type OblDisputeDetailRow = {
  dispute: ReturnType<typeof serializeOblDispute>;
  invoice: ReturnType<typeof serializeOblInvoiceFromHeader>;
  contract: OblContractSummary | null;
};

export type OblRelationshipRow = {
  counterparty: string;
  roles: Array<'provider' | 'client'>;
  contractCount: number;
  balance: ReturnType<typeof computePairBalance>;
  lastActivityEventSeq: string | null;
  lastActivityAt: string | null;
};

@Injectable()
export class OblRelationshipsService {
  constructor(private readonly obl: OblRepository) {}

  async listForAccount(
    accountRaw: string,
    query: ListOblRelationshipsQuery,
  ): Promise<OffsetPage<OblRelationshipRow>> {
    const account = normalizeHiveAccount(accountRaw);
    const counterparties = await this.obl.listCounterpartiesPaginated(
      account,
      query.limit + 1,
      query.offset,
    );
    const page = buildOffsetPage(counterparties, query.limit);
    if (page.items.length === 0) {
      return { items: [], hasMore: page.hasMore };
    }

    const pairs = page.items.map((counterparty) => {
      const { pairLow, pairHigh } = normalizePair(account, counterparty);
      return { counterparty, pairLow, pairHigh };
    });
    const pairRefs = pairs.map(({ pairLow, pairHigh }) => ({ pairLow, pairHigh }));

    const [countsMap, startedSeqsMap, activityMap, allInvoices, allPayments] =
      await Promise.all([
        this.obl.summarizeContractsForAccountPairs(account, pairRefs),
        this.obl.findLedgerStartedSeqsForPairs(pairRefs),
        this.obl.latestContractActivitySeqForPairs(pairRefs),
        this.obl.listInvoicesForPairs(pairRefs),
        this.obl.listPaymentsForPairs(pairRefs),
      ]);

    const items = pairs.map(({ counterparty, pairLow, pairHigh }) => {
      const key = pairKey(pairLow, pairHigh);
      const counts = countsMap.get(key) ?? {
        total: 0,
        asProvider: 0,
        asClient: 0,
      };
      const roles: Array<'provider' | 'client'> = [];
      if (counts.asProvider > 0) {
        roles.push('provider');
      }
      if (counts.asClient > 0) {
        roles.push('client');
      }
      const startedSeq = startedSeqsMap.get(key) ?? null;
      const invoices = filterByLedgerCutoff(
        allInvoices.filter(
          (row) => row.pair_low === pairLow && row.pair_high === pairHigh,
        ),
        startedSeq,
      );
      const payments = filterByLedgerCutoff(
        allPayments.filter(
          (row) => row.pair_low === pairLow && row.pair_high === pairHigh,
        ),
        startedSeq,
      );
      const balance = computePairBalance(
        account,
        counterparty,
        invoices.map((inv) => toBalanceInvoiceRow(inv)),
        payments.map((pay) => ({
          payer: pay.payer,
          receiver: pay.receiver,
          amount_usd: String(pay.amount_usd),
          state: pay.state,
        })),
      );
      const lastSeq = activityMap.get(key) ?? null;
      return {
        counterparty,
        roles,
        contractCount: counts.total,
        balance,
        lastActivityEventSeq: lastSeq !== null ? lastSeq.toString() : null,
        lastActivityAt: lastSeq !== null ? lastSeq.toString() : null,
      };
    });

    return { items, hasMore: page.hasMore };
  }

  async getContract(contractId: string) {
    const contract = await this.obl.findContractWithOffer(contractId);
    if (!contract) {
      throw new NotFoundException('OBL contract not found');
    }
    return serializeOblContract(
      contract,
      contract.offer_name,
      contract.offer_description,
    );
  }

  async getInvoice(invoiceId: string): Promise<OblInvoiceDetailRow> {
    const invoice = await this.obl.findInvoiceById(invoiceId);
    if (!invoice) {
      throw new NotFoundException('OBL invoice not found');
    }
    const lines = await this.obl.listLinesForInvoice(invoiceId);
    const contractRow = invoice.contract_id
      ? await this.obl.findContractWithOffer(invoice.contract_id)
      : null;
    return {
      invoice: serializeOblInvoiceFromHeader(invoice, lines),
      contract: contractRow
        ? serializeOblContract(
            contractRow,
            contractRow.offer_name,
            contractRow.offer_description,
          )
        : null,
    };
  }

  async getDispute(disputeId: string): Promise<OblDisputeDetailRow> {
    const dispute = await this.obl.findDisputeById(disputeId);
    if (!dispute) {
      throw new NotFoundException('OBL dispute not found');
    }
    const invoice = await this.obl.findInvoiceById(dispute.invoice_id);
    if (!invoice) {
      throw new NotFoundException('OBL invoice not found');
    }
    const lines = await this.obl.listLinesForInvoice(dispute.invoice_id);
    const contractRow = invoice.contract_id
      ? await this.obl.findContractWithOffer(invoice.contract_id)
      : null;
    return {
      dispute: serializeOblDispute(dispute),
      invoice: serializeOblInvoiceFromHeader(invoice, lines),
      contract: contractRow
        ? serializeOblContract(
            contractRow,
            contractRow.offer_name,
            contractRow.offer_description,
          )
        : null,
    };
  }
}
