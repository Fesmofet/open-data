import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { NewHiveEngineSwap } from '@opden-data-layer/core';
import type { Database } from '../database';
import { KYSELY } from '../database';

const BULK_INSERT_CHUNK = 500;

/** Kysely instance or transaction client (same query API). */
export type DbExecutor = Kysely<Database>;

@Injectable()
export class HiveEngineSwapsRepository {
  private readonly logger = new Logger(HiveEngineSwapsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  executor(trx?: DbExecutor): DbExecutor {
    return trx ?? this.db;
  }

  async insertSwap(row: NewHiveEngineSwap, trx?: DbExecutor): Promise<void> {
    await this.executor(trx)
      .insertInto('hive_engine_swaps')
      .values(row)
      .onConflict((oc) => oc.columns(['transaction_id', 'account']).doNothing())
      .execute();
  }

  async insertSwapsBatch(rows: NewHiveEngineSwap[], trx?: DbExecutor): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    const e = this.executor(trx);
    for (let i = 0; i < rows.length; i += BULK_INSERT_CHUNK) {
      const chunk = rows.slice(i, i + BULK_INSERT_CHUNK);
      try {
        await e
          .insertInto('hive_engine_swaps')
          .values(chunk)
          .onConflict((oc) => oc.columns(['transaction_id', 'account']).doNothing())
          .execute();
      } catch (err) {
        this.logger.error((err as Error).message);
        throw err;
      }
    }
  }
}
