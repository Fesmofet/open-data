import { Injectable, Logger } from '@nestjs/common';
import { encodeEventSeq, WAIV_TOKEN } from '@opden-data-layer/core';
import { OblRepository } from '../../repositories/obl.repository';
import { normalizePair, asJsonValue } from './obl.utils';
import { OblUsdRatesService } from './obl-usd-rates.service';

const TRACKED_TRANSFER_SYMBOLS = new Set<string>([WAIV_TOKEN.SYMBOL]);

@Injectable()
export class OblPaymentAttributionService {
  private readonly logger = new Logger(OblPaymentAttributionService.name);

  constructor(
    private readonly oblRepository: OblRepository,
    private readonly usdRates: OblUsdRatesService,
  ) {}

  isTrackedTransferSymbol(symbol: string): boolean {
    return TRACKED_TRANSFER_SYMBOLS.has(symbol.trim().toUpperCase());
  }

  async recordTokenTransfer(input: {
    payer: string;
    receiver: string;
    symbol: string;
    quantity: number;
    transactionId: string;
    refHiveBlockNumber: number;
    trxIndex: number;
    logIndex: number;
    createdAt?: Date;
  }): Promise<void> {
    const payer = input.payer.trim();
    const receiver = input.receiver.trim();
    if (payer === '' || receiver === '' || payer === receiver) {
      return;
    }

    const symbol = input.symbol.trim().toUpperCase();
    if (!this.isTrackedTransferSymbol(symbol)) {
      return;
    }

    const { pairLow, pairHigh } = normalizePair(payer, receiver);
    const startedSeq = await this.oblRepository.findLedgerStartedSeq(pairLow, pairHigh);
    const eventSeq = encodeEventSeq({
      blockNum: input.refHiveBlockNumber,
      trxIndex: input.trxIndex,
      opIndex: 0,
      odlEventIndex: input.logIndex,
    });
    if (startedSeq === null || eventSeq < startedSeq) {
      return;
    }

    const paymentId = `obl:he-transfer:${input.transactionId}:${input.logIndex}`;
    const existing = await this.oblRepository.findPayment(paymentId);
    if (existing) {
      return;
    }

    const quote = await this.usdRates.tokenToUsd(symbol, input.quantity);
    if (!quote) {
      return;
    }

    await this.oblRepository.insertPayment({
      payment_id: paymentId,
      payer,
      receiver,
      amount_usd: quote.amountUsd,
      declared_amount_usd: quote.amountUsd,
      method: 'token_transfer',
      token_symbol: symbol,
      token_amount: String(input.quantity),
      rate_usd: quote.rateUsd,
      state: 'confirmed',
      ref: asJsonValue({ he_tx: input.transactionId }),
      created_event_seq: eventSeq,
      transaction_id: input.transactionId,
      created_at: input.createdAt ?? new Date(),
    });
  }

  async recordUpvoteReward(input: {
    voter: string;
    author: string;
    symbol: string;
    quantity: number;
    authorperm: string;
    heTransactionId: string;
    refHiveBlockNumber: number;
    trxIndex: number;
    logIndex: number;
    createdAt?: Date;
  }): Promise<void> {
    const payer = input.voter.trim();
    const receiver = input.author.trim();
    if (payer === '' || receiver === '' || payer === receiver) {
      return;
    }

    const symbol = input.symbol.trim().toUpperCase();
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
      return;
    }

    const { pairLow, pairHigh } = normalizePair(payer, receiver);
    const startedSeq = await this.oblRepository.findLedgerStartedSeq(pairLow, pairHigh);
    const eventSeq = encodeEventSeq({
      blockNum: input.refHiveBlockNumber,
      trxIndex: input.trxIndex,
      opIndex: 0,
      odlEventIndex: input.logIndex,
    });
    if (startedSeq === null || eventSeq < startedSeq) {
      return;
    }

    const paymentId = `obl:he-curation:${input.heTransactionId}:${input.logIndex}`;
    const existing = await this.oblRepository.findPayment(paymentId);
    if (existing) {
      return;
    }

    const quote = await this.usdRates.tokenToUsd(symbol, input.quantity);
    if (!quote) {
      return;
    }

    await this.oblRepository.insertPayment({
      payment_id: paymentId,
      payer,
      receiver,
      amount_usd: quote.amountUsd,
      declared_amount_usd: quote.amountUsd,
      method: 'upvote_reward',
      token_symbol: symbol,
      token_amount: String(input.quantity),
      rate_usd: quote.rateUsd,
      state: 'confirmed',
      ref: asJsonValue({ authorperm: input.authorperm }),
      created_event_seq: eventSeq,
      transaction_id: input.heTransactionId,
      created_at: input.createdAt ?? new Date(),
    });
  }
}
