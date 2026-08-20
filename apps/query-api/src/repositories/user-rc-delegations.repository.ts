import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import { UserRcDelegation } from '@opden-data-layer/odl-db-types';

import type { Database } from '../database';
import { KYSELY } from '../database';

@Injectable()
export class UserRcDelegationsRepository {
  private readonly logger = new Logger(UserRcDelegationsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async findRcDelegationsTo(delegatee: string): Promise<UserRcDelegation[]> {
    try {
      return await this.db
        .selectFrom('user_rc_delegations')
        .selectAll()
        .where('delegatee', '=', delegatee)
        .where(sql<boolean>`rc::bigint > 0`)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }
}
