import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import { KYSELY, type Database } from '../database';

export type UserExpertiseScope = 'hashtags' | 'objects';

export type UserExpertiseRow = {
  object_id: string;
  weight: number;
  object_type: string;
};

export type ObjectExpertiseAccountRow = {
  name: string;
  profile_image: string | null;
  users_following_count: number;
  weight: number;
};

@Injectable()
export class UserObjectExpertiseRepository {
  private readonly logger = new Logger(UserObjectExpertiseRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  private scopeQuery(
    account: string,
    scope: UserExpertiseScope,
  ) {
    let q = this.db
      .selectFrom('user_object_expertise')
      .innerJoin('objects_core', 'objects_core.object_id', 'user_object_expertise.object_id')
      .where('user_object_expertise.account', '=', account)
      .where('user_object_expertise.weight', '>', 0)
      .where('objects_core.status', '=', 'active');

    return scope === 'hashtags'
      ? q.where('objects_core.object_type', '=', 'hashtag')
      : q.where('objects_core.object_type', '!=', 'hashtag');
  }

  async countByScope(account: string, scope: UserExpertiseScope): Promise<number> {
    try {
      const row = await this.scopeQuery(account, scope)
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .executeTakeFirst();
      return Number(row?.count ?? 0);
    } catch (e) {
      this.logger.error((e as Error).message);
      return 0;
    }
  }

  async listByScope(
    account: string,
    scope: UserExpertiseScope,
    skip: number,
    limit: number,
  ): Promise<UserExpertiseRow[]> {
    try {
      return await this.scopeQuery(account, scope)
        .select([
          'user_object_expertise.object_id as object_id',
          'user_object_expertise.weight as weight',
          'objects_core.object_type as object_type',
        ])
        .orderBy('user_object_expertise.weight', 'desc')
        .orderBy('user_object_expertise.object_id', 'asc')
        .offset(skip)
        .limit(limit + 1)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }

  async countByObjectId(objectId: string): Promise<number> {
    try {
      const row = await this.db
        .selectFrom('user_object_expertise')
        .where('object_id', '=', objectId)
        .where('weight', '>', 0)
        .select(sql<number>`count(*)::int`.as('c'))
        .executeTakeFirst();
      return Number(row?.c ?? 0);
    } catch (e) {
      this.logger.error((e as Error).message);
      return 0;
    }
  }

  async listAccountsByObjectId(
    objectId: string,
    skip: number,
    limit: number,
  ): Promise<ObjectExpertiseAccountRow[]> {
    try {
      return await this.db
        .selectFrom('user_object_expertise as uoe')
        .innerJoin('accounts_current as ac', (join) =>
          join.onRef('uoe.account', '=', 'ac.name'),
        )
        .where('uoe.object_id', '=', objectId)
        .where('uoe.weight', '>', 0)
        .select([
          sql<string>`ac.name`.as('name'),
          sql<string | null>`ac.profile_image`.as('profile_image'),
          sql<number>`ac.users_following_count`.as('users_following_count'),
          sql<number>`uoe.weight`.as('weight'),
        ])
        .orderBy(sql`uoe.weight`, 'desc')
        .orderBy(sql`ac.name`, 'asc')
        .offset(skip)
        .limit(limit)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }
}
