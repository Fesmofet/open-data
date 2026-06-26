import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { HiveEngineWaivAirdrop } from '@opden-data-layer/core';
import type { Database } from '../database';
import { KYSELY } from '../database';

@Injectable()
export class HiveEngineWaivAirdropsRepository {
  private readonly logger = new Logger(HiveEngineWaivAirdropsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async findByAccount(
    account: string,
    limit: number,
    maxTimestampSeconds: number | null,
    dateRange?: { startDate: number; endDate: number },
  ): Promise<HiveEngineWaivAirdrop[]> {
    try {
      let query = this.db
        .selectFrom('hive_engine_waiv_airdrops')
        .selectAll()
        .where('account', '=', account);

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
