import { Injectable, Logger } from '@nestjs/common';
import type { OblDisputeRule } from '@opden-data-layer/core';
import { OblRepository } from '../../../repositories/obl.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { disputeResolvePayloadSchema } from '../obl-envelope.schema';
import { toUsdString } from '../obl.utils';

@Injectable()
export class DisputeResolveHandler implements OdlActionHandler {
  readonly action = 'dispute_resolve';
  private readonly logger = new Logger(DisputeResolveHandler.name);

  constructor(private readonly oblRepository: OblRepository) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const parsed = disputeResolvePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(`Invalid dispute_resolve payload: ${parsed.error.message}`);
      return;
    }
    const data = parsed.data;
    if (ctx.creator !== data.resolver) {
      this.logger.warn('dispute_resolve: resolver mismatch');
      return;
    }

    const dispute = await this.oblRepository.findDispute(data.dispute_id);
    if (!dispute || dispute.status !== 'open') {
      this.logger.warn('dispute_resolve: open dispute not found');
      return;
    }

    const invoice = await this.oblRepository.findInvoice(dispute.invoice_id);
    if (!invoice) {
      this.logger.warn('dispute_resolve: invoice not found');
      return;
    }
    if (invoice.state !== 'disputed') {
      this.logger.warn('dispute_resolve: invoice is not disputed');
      return;
    }

    const contract = invoice.contract_id
      ? await this.oblRepository.findContract(invoice.contract_id)
      : null;

    const disputeRule: OblDisputeRule = contract?.dispute_rule ?? 'client';
    const arbiter = contract?.arbiter ?? null;
    const provider = contract?.provider ?? invoice.creditor;
    const client = contract?.client ?? invoice.debtor;

    if (!this.canResolve(disputeRule, arbiter, provider, client, data.resolver)) {
      this.logger.warn('dispute_resolve: resolver not authorized by dispute_rule');
      return;
    }

    let finalUsd: string;
    try {
      finalUsd = toUsdString(data.final_amount_usd);
    } catch {
      this.logger.warn('dispute_resolve: invalid final_amount_usd');
      return;
    }

    await this.oblRepository.runInTransaction(async (trx) => {
      await this.oblRepository.resolveDispute(
        data.dispute_id,
        {
          final_amount_usd: finalUsd,
          resolver: data.resolver,
          resolved_event_seq: ctx.eventSeq,
        },
        trx,
      );
      await this.oblRepository.updateInvoice(
        dispute.invoice_id,
        { state: 'resolved', final_amount_usd: finalUsd },
        trx,
      );
    });
  }

  private canResolve(
    rule: OblDisputeRule,
    arbiter: string | null,
    provider: string,
    client: string,
    resolver: string,
  ): boolean {
    if (rule === 'arbiter') {
      return arbiter !== null && resolver === arbiter;
    }
    if (rule === 'client') {
      return resolver === client;
    }
    if (rule === 'provider') {
      return resolver === provider;
    }
    return false;
  }
}
