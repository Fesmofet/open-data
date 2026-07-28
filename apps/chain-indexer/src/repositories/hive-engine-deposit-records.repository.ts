import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { NewHiveEngineDepositRecord } from '@opden-data-layer/core';
import type { Database } from '../database';
import { KYSELY } from '../database';

export type DbExecutor = Kysely<Database>;

@Injectable()
export class HiveEngineDepositRecordsRepository {
  private readonly logger = new Logger(HiveEngineDepositRecordsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  executor(trx?: DbExecutor): DbExecutor {
    return trx ?? this.db;
  }

  async insertRecord(
    row: NewHiveEngineDepositRecord,
    trx?: DbExecutor,
  ): Promise<void> {
    try {
      await this.executor(trx)
        .insertInto('hive_engine_deposit_records')
        .values(row)
        .onConflict((oc) => oc.columns(['transaction_id', 'account']).doNothing())
        .execute();
    } catch (err) {
      this.logger.error((err as Error).message);
      throw err;
    }
  }
}
