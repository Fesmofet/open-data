import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { UserDelegation } from '@opden-data-layer/odl-db-types';

import type { Database } from '../database';
import { KYSELY } from '../database';

const HP_DELEGATIONS_QUERY_LIMIT = 1000;

@Injectable()
export class UserDelegationsRepository {
  private readonly logger = new Logger(UserDelegationsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async findHpDelegationsTo(delegatee: string): Promise<UserDelegation[]> {
    try {
      return await this.db
        .selectFrom('user_delegations')
        .selectAll()
        .where('delegatee', '=', delegatee)
        .where('vesting_shares', '>', 0)
        .orderBy('vesting_shares', 'desc')
        .limit(HP_DELEGATIONS_QUERY_LIMIT)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }

  async findHpDelegationsFrom(delegator: string): Promise<UserDelegation[]> {
    try {
      return await this.db
        .selectFrom('user_delegations')
        .selectAll()
        .where('delegator', '=', delegator)
        .where('vesting_shares', '>', 0)
        .orderBy('vesting_shares', 'desc')
        .limit(HP_DELEGATIONS_QUERY_LIMIT)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }
}
