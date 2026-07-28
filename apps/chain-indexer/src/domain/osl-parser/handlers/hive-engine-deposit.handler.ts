import { hiveBlockTimestampToDate } from '@opden-data-layer/core';
import { Injectable, Logger } from '@nestjs/common';
import { HiveEngineDepositRecordsRepository } from '../../../repositories/hive-engine-deposit-records.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { hiveEngineDepositPayloadSchema } from '../osl-envelope.schema';

@Injectable()
export class HiveEngineDepositHandler implements OdlActionHandler {
  readonly action = 'hive_engine_deposit';
  private readonly logger = new Logger(HiveEngineDepositHandler.name);

  constructor(
    private readonly depositRecords: HiveEngineDepositRecordsRepository,
  ) {}

  async handle(
    payload: Record<string, unknown>,
    ctx: OdlEventContext,
  ): Promise<void> {
    const parsed = hiveEngineDepositPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(
        `Invalid hive_engine_deposit payload: ${parsed.error.message}`,
      );
      return;
    }
    const data = parsed.data;
    if (ctx.creator !== data.author) {
      this.logger.warn('hive_engine_deposit: creator mismatch');
      return;
    }

    const depositAccount = data.deposit_account?.trim() || null;
    const address = data.address?.trim() || null;

    await this.depositRecords.insertRecord({
      account: ctx.creator,
      transaction_id: ctx.transactionId,
      ref_hive_block_number: ctx.blockNum,
      block_timestamp: hiveBlockTimestampToDate(ctx.timestamp),
      destination: data.destination,
      symbol_in: data.symbol_in,
      symbol_out: data.symbol_out,
      pair: data.pair,
      ex_rate: data.ex_rate,
      deposit_account: depositAccount,
      address,
      memo: data.memo ?? null,
    });
  }
}
