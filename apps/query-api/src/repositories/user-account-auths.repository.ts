import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { HiveAccountAuthorityType } from '@opden-data-layer/odl-db-types';

import type { Database } from '../database';
import { KYSELY } from '../database';

export type UserAccountAuthGrantorRow = {
  grantor: string;
  authority_type: HiveAccountAuthorityType;
};

export type UserAccountAuthGranteeRow = {
  grantee: string;
  authority_type: HiveAccountAuthorityType;
};

@Injectable()
export class UserAccountAuthsRepository {
  private readonly logger = new Logger(UserAccountAuthsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async countGrantorsFor(
    grantee: string,
    authorityType?: HiveAccountAuthorityType,
  ): Promise<number> {
    try {
      let qb = this.db
        .selectFrom('user_account_auths')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .where('grantee', '=', grantee);
      if (authorityType) {
        qb = qb.where('authority_type', '=', authorityType);
      }
      const row = await qb.executeTakeFirst();
      return Number(row?.count ?? 0);
    } catch (e) {
      this.logger.error((e as Error).message);
      return 0;
    }
  }

  async findGrantorsFor(
    grantee: string,
    authorityType: HiveAccountAuthorityType | undefined,
    skip: number,
    limit: number,
  ): Promise<UserAccountAuthGrantorRow[]> {
    try {
      let qb = this.db
        .selectFrom('user_account_auths')
        .select(['grantor', 'authority_type'])
        .where('grantee', '=', grantee)
        .orderBy('grantor', 'asc')
        .orderBy('authority_type', 'asc');
      if (authorityType) {
        qb = qb.where('authority_type', '=', authorityType);
      }
      return await qb.offset(skip).limit(limit).execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }

  async countGranteesFor(
    grantor: string,
    authorityType?: HiveAccountAuthorityType,
  ): Promise<number> {
    try {
      let qb = this.db
        .selectFrom('user_account_auths')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .where('grantor', '=', grantor);
      if (authorityType) {
        qb = qb.where('authority_type', '=', authorityType);
      }
      const row = await qb.executeTakeFirst();
      return Number(row?.count ?? 0);
    } catch (e) {
      this.logger.error((e as Error).message);
      return 0;
    }
  }

  async findGranteesFor(
    grantor: string,
    authorityType: HiveAccountAuthorityType | undefined,
    skip: number,
    limit: number,
  ): Promise<UserAccountAuthGranteeRow[]> {
    try {
      let qb = this.db
        .selectFrom('user_account_auths')
        .select(['grantee', 'authority_type'])
        .where('grantor', '=', grantor)
        .orderBy('grantee', 'asc')
        .orderBy('authority_type', 'asc');
      if (authorityType) {
        qb = qb.where('authority_type', '=', authorityType);
      }
      return await qb.offset(skip).limit(limit).execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }
}
