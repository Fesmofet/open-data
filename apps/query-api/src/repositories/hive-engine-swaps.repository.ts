import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { HiveEngineSwap } from '@opden-data-layer/core';
import type { Database } from '../database';
import { KYSELY } from '../database';

@Injectable()
export class HiveEngineSwapsRepository {
  private readonly logger = new Logger(HiveEngineSwapsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async findWaivByAccount(
    account: string,
    limit: number,
    maxTimestampSeconds: number | null,
    dateRange?: { startDate: number; endDate: number },
  ): Promise<HiveEngineSwap[]> {
    return this.findByAccountWithSymbolFilter(
      account,
      { mode: 'waiv' },
      limit,
      maxTimestampSeconds,
      dateRange,
    );
  }

  async findByAccount(
    account: string,
    limit: number,
    maxTimestampSeconds: number | null,
  ): Promise<HiveEngineSwap[]> {
    return this.findByAccountWithSymbolFilter(
      account,
      { mode: 'all' },
      limit,
      maxTimestampSeconds,
    );
  }

  private async findByAccountWithSymbolFilter(
    account: string,
    symbolFilter:
      | { mode: 'all' }
      | { mode: 'waiv' },
    limit: number,
    maxTimestampSeconds: number | null,
    dateRange?: { startDate: number; endDate: number },
  ): Promise<HiveEngineSwap[]> {
    try {
      let query = this.db
        .selectFrom('hive_engine_swaps')
        .selectAll()
        .where('account', '=', account);

      if (symbolFilter.mode === 'waiv') {
        query = query.where((eb) =>
          eb.or([
            eb('symbol_in', '=', 'WAIV'),
            eb('symbol_out', '=', 'WAIV'),
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

      if (dateRange) {
        query = query
          .where(
            'block_timestamp',
            '>=',
            new Date(dateRange.startDate * 1000),
          )
          .where(
            'block_timestamp',
            '<=',
            new Date(dateRange.endDate * 1000),
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
