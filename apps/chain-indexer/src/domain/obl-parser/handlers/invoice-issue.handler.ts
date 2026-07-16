import { Injectable, Logger } from '@nestjs/common';
import { OblRepository } from '../../../repositories/obl.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { invoiceIssuePayloadSchema } from '../obl-envelope.schema';
import { normalizePair, toUsdString, asJsonValue } from '../obl.utils';

@Injectable()
export class InvoiceIssueHandler implements OdlActionHandler {
  readonly action = 'invoice_issue';
  private readonly logger = new Logger(InvoiceIssueHandler.name);

  constructor(private readonly oblRepository: OblRepository) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const parsed = invoiceIssuePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(`Invalid invoice_issue payload: ${parsed.error.message}`);
      return;
    }
    const data = parsed.data;
    if (ctx.creator !== data.issuer) {
      this.logger.warn('invoice_issue: issuer mismatch');
      return;
    }
    if (data.issuer !== data.debtor && data.issuer !== data.creditor) {
      this.logger.warn('invoice_issue: issuer must be debtor or creditor');
      return;
    }

    const existing = await this.oblRepository.findInvoice(data.invoice_id);
    if (existing) {
      this.logger.warn('invoice_issue: invoice already exists');
      return;
    }

    const { pairLow, pairHigh } = normalizePair(data.debtor, data.creditor);
    const hasLedger = await this.oblRepository.hasLedgerForPair(pairLow, pairHigh);
    const state = hasLedger ? 'confirmed' : 'pending';

    let amountUsd: string;
    try {
      amountUsd = toUsdString(data.amount_usd);
    } catch {
      this.logger.warn('invoice_issue: invalid amount_usd');
      return;
    }

    await this.oblRepository.insertInvoice({
      invoice_id: data.invoice_id,
      contract_id: data.contract_id ?? null,
      issuer: data.issuer,
      debtor: data.debtor,
      creditor: data.creditor,
      amount_usd: amountUsd,
      final_amount_usd: null,
      details: asJsonValue(data.details ?? {}),
      state,
      created_event_seq: ctx.eventSeq,
      transaction_id: ctx.transactionId,
    });
  }
}
