import { Injectable, Logger } from '@nestjs/common';
import { OblRepository } from '../../../repositories/obl.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { paymentConfirmPayloadSchema } from '../obl-envelope.schema';
import { normalizePair, toUsdString, asJsonValue } from '../obl.utils';

@Injectable()
export class PaymentConfirmHandler implements OdlActionHandler {
  readonly action = 'payment_confirm';
  private readonly logger = new Logger(PaymentConfirmHandler.name);

  constructor(private readonly oblRepository: OblRepository) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const parsed = paymentConfirmPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(`Invalid payment_confirm payload: ${parsed.error.message}`);
      return;
    }
    const data = parsed.data;
    if (ctx.creator !== data.receiver) {
      this.logger.warn('payment_confirm: receiver mismatch');
      return;
    }

    let confirmUsd: string;
    try {
      confirmUsd = toUsdString(data.amount_usd);
    } catch {
      this.logger.warn('payment_confirm: invalid amount_usd');
      return;
    }

    if (data.declare_payment_id) {
      const pending = await this.oblRepository.findPayment(data.declare_payment_id);
      if (!pending || pending.receiver !== data.receiver) {
        this.logger.warn('payment_confirm: declare payment not found');
        return;
      }
      if (pending.state !== 'pending') {
        this.logger.warn('payment_confirm: declare payment is not pending');
        return;
      }
      const pendingUsd = Number(pending.amount_usd);
      const confirmNum = Number(confirmUsd);
      await this.oblRepository.runInTransaction(async (trx) => {
        if (confirmNum >= pendingUsd) {
          await this.oblRepository.updatePayment(
            data.declare_payment_id!,
            {
              state: 'confirmed',
              amount_usd: pending.amount_usd,
            },
            trx,
          );
          const remainder = confirmNum - pendingUsd;
          if (remainder > 0) {
            await this.oblRepository.insertPayment(
              {
                payment_id: data.payment_id,
                payer: pending.payer,
                receiver: pending.receiver,
                amount_usd: remainder.toFixed(8),
                method: 'offchain',
                token_symbol: null,
                token_amount: null,
                rate_usd: null,
                state: 'confirmed',
                contract_id: pending.contract_id,
                ref: asJsonValue({ excess_confirm: true }),
                created_event_seq: ctx.eventSeq,
                transaction_id: ctx.transactionId,
              },
              trx,
            );
          }
          return;
        }
        await this.oblRepository.updatePayment(
          data.declare_payment_id!,
          {
            state: 'confirmed',
            amount_usd: confirmUsd,
          },
          trx,
        );
        const remainder = (pendingUsd - confirmNum).toFixed(8);
        await this.oblRepository.insertPayment(
          {
            payment_id: data.payment_id,
            payer: pending.payer,
            receiver: pending.receiver,
            amount_usd: remainder,
            method: 'offchain',
            token_symbol: null,
            token_amount: null,
            rate_usd: null,
            state: 'pending',
            contract_id: pending.contract_id,
            ref: asJsonValue({ partial_remainder_of: data.declare_payment_id }),
            created_event_seq: ctx.eventSeq,
            transaction_id: ctx.transactionId,
          },
          trx,
        );
      });
      return;
    }

    if (!data.payer) {
      this.logger.warn('payment_confirm: payer required without declare_payment_id');
      return;
    }

    const existing = await this.oblRepository.findPayment(data.payment_id);
    if (existing) {
      this.logger.warn('payment_confirm: payment already exists');
      return;
    }

    const { pairLow, pairHigh } = normalizePair(data.payer, data.receiver);
    const startedSeq = await this.oblRepository.findLedgerStartedSeq(pairLow, pairHigh);
    if (startedSeq === null || ctx.eventSeq < startedSeq) {
      this.logger.warn('payment_confirm: no active ledger or before cutoff');
      return;
    }

    await this.oblRepository.insertPayment({
      payment_id: data.payment_id,
      payer: data.payer,
      receiver: data.receiver,
      amount_usd: confirmUsd,
      method: 'offchain',
      token_symbol: null,
      token_amount: null,
      rate_usd: null,
      state: 'confirmed',
      contract_id: null,
      ref: asJsonValue({ receiver_only_confirm: true }),
      created_event_seq: ctx.eventSeq,
      transaction_id: ctx.transactionId,
    });
  }
}
