import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { NewUserRcDelegation } from '@opden-data-layer/core';
import type { Database } from '../database';
import { KYSELY } from '../database';

export type DbExecutor = Kysely<Database>;

@Injectable()
export class UserRcDelegationsRepository {
  private readonly logger = new Logger(UserRcDelegationsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  executor(trx?: DbExecutor): DbExecutor {
    return trx ?? this.db;
  }

  async upsertRcDelegation(
    row: NewUserRcDelegation,
    trx?: DbExecutor,
  ): Promise<void> {
    try {
      await this.executor(trx)
        .insertInto('user_rc_delegations')
        .values(row)
        .onConflict((oc) =>
          oc.columns(['delegator', 'delegatee']).doUpdateSet({
            rc: row.rc,
          }),
        )
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async removeRcDelegations(
    delegator: string,
    delegatees: string[],
    trx?: DbExecutor,
  ): Promise<void> {
    if (delegatees.length === 0) {
      return;
    }
    try {
      await this.executor(trx)
        .deleteFrom('user_rc_delegations')
        .where('delegator', '=', delegator)
        .where('delegatee', 'in', delegatees)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }
}
