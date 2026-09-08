import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { HiveAccountAuthorityType } from '@opden-data-layer/odl-db-types';

import type { Database } from '../database';
import { KYSELY } from '../database';

export type UserAccountAuthListSort = 'rank' | 'followers' | 'a-z' | 'recency';

export type UserAccountAuthGrantorJoinedRow = {
  grantor: string;
  authority_type: HiveAccountAuthorityType;
  updated_at_block: number;
  posting_json_metadata: string | null;
  json_metadata: string | null;
  profile_image: string | null;
  wobjects_weight: number | null;
  users_following_count: number | null;
};

export type UserAccountAuthGranteeJoinedRow = {
  grantee: string;
  authority_type: HiveAccountAuthorityType;
  updated_at_block: number;
  posting_json_metadata: string | null;
  json_metadata: string | null;
  profile_image: string | null;
  wobjects_weight: number | null;
  users_following_count: number | null;
};

export type UserAccountAuthListFindParams = {
  authorityType?: HiveAccountAuthorityType;
  sort: UserAccountAuthListSort;
  skip: number;
  limit: number;
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
    params: UserAccountAuthListFindParams,
  ): Promise<UserAccountAuthGrantorJoinedRow[]> {
    try {
      let qb = this.db
        .selectFrom('user_account_auths as uaa')
        .leftJoin('accounts_current as ac', (join) =>
          join.onRef('uaa.grantor', '=', 'ac.name'),
        )
        .select([
          sql<string>`uaa.grantor`.as('grantor'),
          sql<HiveAccountAuthorityType>`uaa.authority_type`.as('authority_type'),
          sql<number>`uaa.updated_at_block`.as('updated_at_block'),
          sql<string | null>`ac.posting_json_metadata`.as('posting_json_metadata'),
          sql<string | null>`ac.json_metadata`.as('json_metadata'),
          sql<string | null>`ac.profile_image`.as('profile_image'),
          sql<number | null>`ac.wobjects_weight`.as('wobjects_weight'),
          sql<number | null>`ac.users_following_count`.as('users_following_count'),
        ])
        .where('uaa.grantee', '=', grantee);

      if (params.authorityType) {
        qb = qb.where('uaa.authority_type', '=', params.authorityType);
      }

      const ordered =
        params.sort === 'followers'
          ? qb
              .orderBy(sql`ac.users_following_count`, 'desc')
              .orderBy(sql`uaa.grantor`, 'asc')
              .orderBy(sql`uaa.authority_type`, 'asc')
          : params.sort === 'a-z'
            ? qb.orderBy(sql`uaa.grantor`, 'asc').orderBy(sql`uaa.authority_type`, 'asc')
            : params.sort === 'recency'
              ? qb
                  .orderBy(sql`uaa.updated_at_block`, 'desc')
                  .orderBy(sql`uaa.grantor`, 'asc')
                  .orderBy(sql`uaa.authority_type`, 'asc')
              : qb
                  .orderBy(sql`ac.wobjects_weight desc nulls last`)
                  .orderBy(sql`uaa.grantor`, 'asc')
                  .orderBy(sql`uaa.authority_type`, 'asc');

      return await ordered.offset(params.skip).limit(params.limit).execute();
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
    params: UserAccountAuthListFindParams,
  ): Promise<UserAccountAuthGranteeJoinedRow[]> {
    try {
      let qb = this.db
        .selectFrom('user_account_auths as uaa')
        .leftJoin('accounts_current as ac', (join) =>
          join.onRef('uaa.grantee', '=', 'ac.name'),
        )
        .select([
          sql<string>`uaa.grantee`.as('grantee'),
          sql<HiveAccountAuthorityType>`uaa.authority_type`.as('authority_type'),
          sql<number>`uaa.updated_at_block`.as('updated_at_block'),
          sql<string | null>`ac.posting_json_metadata`.as('posting_json_metadata'),
          sql<string | null>`ac.json_metadata`.as('json_metadata'),
          sql<string | null>`ac.profile_image`.as('profile_image'),
          sql<number | null>`ac.wobjects_weight`.as('wobjects_weight'),
          sql<number | null>`ac.users_following_count`.as('users_following_count'),
        ])
        .where('uaa.grantor', '=', grantor);

      if (params.authorityType) {
        qb = qb.where('uaa.authority_type', '=', params.authorityType);
      }

      const ordered =
        params.sort === 'followers'
          ? qb
              .orderBy(sql`ac.users_following_count`, 'desc')
              .orderBy(sql`uaa.grantee`, 'asc')
              .orderBy(sql`uaa.authority_type`, 'asc')
          : params.sort === 'a-z'
            ? qb.orderBy(sql`uaa.grantee`, 'asc').orderBy(sql`uaa.authority_type`, 'asc')
            : params.sort === 'recency'
              ? qb
                  .orderBy(sql`uaa.updated_at_block`, 'desc')
                  .orderBy(sql`uaa.grantee`, 'asc')
                  .orderBy(sql`uaa.authority_type`, 'asc')
              : qb
                  .orderBy(sql`ac.wobjects_weight desc nulls last`)
                  .orderBy(sql`uaa.grantee`, 'asc')
                  .orderBy(sql`uaa.authority_type`, 'asc');

      return await ordered.offset(params.skip).limit(params.limit).execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }
}
