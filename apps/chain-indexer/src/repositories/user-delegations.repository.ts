import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { NewUserDelegation } from '@opden-data-layer/core';
import type { Database } from '../database';
import { KYSELY } from '../database';

export type DbExecutor = Kysely<Database>;

@Injectable()
export class UserDelegationsRepository {
  private readonly logger = new Logger(UserDelegationsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  executor(trx?: DbExecutor): DbExecutor {
    return trx ?? this.db;
  }

  async upsertHpDelegation(
    row: NewUserDelegation,
    trx?: DbExecutor,
  ): Promise<void> {
    try {
      await this.executor(trx)
        .insertInto('user_delegations')
        .values(row)
        .onConflict((oc) =>
          oc.columns(['delegator', 'delegatee']).doUpdateSet({
            vesting_shares: row.vesting_shares,
            delegation_date: row.delegation_date,
          }),
        )
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async deleteHpDelegation(
    delegator: string,
    delegatee: string,
    trx?: DbExecutor,
  ): Promise<void> {
    try {
      await this.executor(trx)
        .deleteFrom('user_delegations')
        .where('delegator', '=', delegator)
        .where('delegatee', '=', delegatee)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }
}
