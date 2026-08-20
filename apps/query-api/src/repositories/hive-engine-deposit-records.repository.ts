import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { HiveEngineDepositRecord } from '@opden-data-layer/odl-db-types';

import { ENGINE_HISTORY_EXCLUDED_SYMBOLS } from '@opden-data-layer/core/hive-engine-history';
import type { Database } from '../database';
import { KYSELY } from '../database';

const WAIV_SYMBOL = 'WAIV';

@Injectable()
export class HiveEngineDepositRecordsRepository {
  private readonly logger = new Logger(HiveEngineDepositRecordsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async findForEngineWallet(
    account: string,
    limit: number,
    maxTimestampSeconds: number | null,
  ): Promise<HiveEngineDepositRecord[]> {
    return this.findByAccount(account, limit, maxTimestampSeconds, 'engine');
  }

  async findForWaivWallet(
    account: string,
    limit: number,
    maxTimestampSeconds: number | null,
  ): Promise<HiveEngineDepositRecord[]> {
    return this.findByAccount(account, limit, maxTimestampSeconds, 'waiv');
  }

  private async findByAccount(
    account: string,
    limit: number,
    maxTimestampSeconds: number | null,
    tab: 'engine' | 'waiv',
  ): Promise<HiveEngineDepositRecord[]> {
    try {
      let query = this.db
        .selectFrom('hive_engine_deposit_records')
        .selectAll()
        .where((eb) =>
          eb.or([
            eb('account', '=', account),
            eb('destination', '=', account),
          ]),
        );

      if (tab === 'engine') {
        for (const symbol of ENGINE_HISTORY_EXCLUDED_SYMBOLS) {
          query = query.where((eb) =>
            eb.and([
              eb('symbol_in', '!=', symbol),
              eb('symbol_out', '!=', symbol),
            ]),
          );
        }
      } else {
        query = query.where((eb) =>
          eb.or([
            eb('symbol_in', '=', WAIV_SYMBOL),
            eb('symbol_out', '=', WAIV_SYMBOL),
          ]),
        );
      }

      if (maxTimestampSeconds !== null) {
        query = query.where(
          'block_timestamp',
          '<=',
          new Date(maxTimestampSeconds * 1000),
        );
      }

      return await query
        .orderBy('block_timestamp', 'desc')
        .orderBy('id', 'desc')
        .limit(limit)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }
}
