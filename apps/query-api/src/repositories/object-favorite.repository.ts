import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database } from '../database';
import { KYSELY } from '../database';
import type { ObjectFavorite } from '@opden-data-layer/odl-db-types';

import type { UserSubscriptionSort, SubscriptionJoinedAccountRow } from './user-subscriptions.repository';

@Injectable()
export class ObjectFavoriteRepository {
  private readonly logger = new Logger(ObjectFavoriteRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async findByObjectId(objectId: string): Promise<ObjectFavorite[]> {
    return this.db
      .selectFrom('object_favorite')
      .where('object_id', '=', objectId)
      .selectAll()
      .execute();
  }

  async find(criteria: Partial<ObjectFavorite>): Promise<ObjectFavorite[]> {
    let query = this.db.selectFrom('object_favorite');

    if (criteria.object_id !== undefined) {
      query = query.where('object_id', '=', criteria.object_id);
    }
    if (criteria.account !== undefined) {
      query = query.where('account', '=', criteria.account);
    }

    return query.selectAll().execute();
  }

  /**
   * Object ids where `account` has a favorite row (for linked-object heart UI).
   */
  async findFavoriteObjectIdsForAccount(account: string, objectIds: string[]): Promise<string[]> {
    if (objectIds.length === 0) {
      return [];
    }
    const rows = await this.db
      .selectFrom('object_favorite')
      .where('account', '=', account)
      .where('object_id', 'in', objectIds)
      .select('object_id')
      .execute();
    return rows.map((r) => r.object_id);
  }

  async countByObjectId(objectId: string): Promise<number> {
    try {
      const row = await this.db
        .selectFrom('object_favorite as of')
        .innerJoin('accounts_current as ac', (join) =>
          join.onRef('of.account', '=', 'ac.name'),
        )
        .where('of.object_id', '=', objectId)
        .select(sql<number>`count(*)::int`.as('c'))
        .executeTakeFirst();
      return Number(row?.c ?? 0);
    } catch (e) {
      this.logger.error((e as Error).message);
      return 0;
    }
  }

  /**
   * Accounts that favorited `object_id`, joined to `accounts_current`, subscription-list sorts + pagination.
   */
  async findAccountsByObjectId(
    objectId: string,
    sort: UserSubscriptionSort,
    skip: number,
    limit: number,
  ): Promise<SubscriptionJoinedAccountRow[]> {
    try {
      const qb = this.db
        .selectFrom('object_favorite as of')
        .innerJoin('accounts_current as ac', (join) =>
          join.onRef('of.account', '=', 'ac.name'),
        )
        .where('of.object_id', '=', objectId)
        .select([
          sql<string>`ac.name`.as('name'),
          sql<string | null>`ac.profile_image`.as('profile_image'),
          sql<number>`ac.wobjects_weight`.as('wobjects_weight'),
          sql<number>`ac.users_following_count`.as('users_following_count'),
        ]);

      const ordered =
        sort === 'followers'
          ? qb.orderBy(sql`ac.users_following_count`, 'desc').orderBy(sql`ac.name`, 'asc')
          : sort === 'a-z'
            ? qb.orderBy(sql`ac.name`, 'asc')
            : sort === 'recency'
              ? qb.orderBy(sql`of.created_at`, 'desc').orderBy(sql`ac.name`, 'asc')
              : qb.orderBy(sql`ac.wobjects_weight desc nulls last`).orderBy(sql`ac.name`, 'asc');

      return await ordered.offset(skip).limit(limit).execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }
}
