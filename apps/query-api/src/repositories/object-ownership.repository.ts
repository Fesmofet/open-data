import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database } from '../database';
import { KYSELY } from '../database';
import type { ObjectOwnership, ObjectOwnershipType } from '@opden-data-layer/odl-db-types';

import type { UserSubscriptionSort, SubscriptionJoinedAccountRow } from './user-subscriptions.repository';

@Injectable()
export class ObjectOwnershipRepository {
  private readonly logger = new Logger(ObjectOwnershipRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async findByObjectId(objectId: string): Promise<ObjectOwnership[]> {
    return this.db
      .selectFrom('object_ownership')
      .where('object_id', '=', objectId)
      .selectAll()
      .execute();
  }

  async find(criteria: Partial<ObjectOwnership>): Promise<ObjectOwnership[]> {
    let query = this.db.selectFrom('object_ownership');

    if (criteria.object_id !== undefined) {
      query = query.where('object_id', '=', criteria.object_id);
    }
    if (criteria.account !== undefined) {
      query = query.where('account', '=', criteria.account);
    }
    if (criteria.ownership_type !== undefined) {
      query = query.where('ownership_type', '=', criteria.ownership_type);
    }

    return query.selectAll().execute();
  }

  /**
   * Object ids where `account` has any ownership row.
   */
  async findOwnershipObjectIdsForAccount(account: string, objectIds: string[]): Promise<string[]> {
    if (objectIds.length === 0) {
      return [];
    }
    const rows = await this.db
      .selectFrom('object_ownership')
      .where('account', '=', account)
      .where('object_id', 'in', objectIds)
      .select('object_id')
      .execute();
    return [...new Set(rows.map((r) => r.object_id))];
  }

  /**
   * Object ids where `account` has an ownership row of the given type.
   */
  async findOwnershipObjectIdsForAccountByType(
    account: string,
    objectIds: string[],
    ownershipType: ObjectOwnershipType,
  ): Promise<string[]> {
    if (objectIds.length === 0) {
      return [];
    }
    const rows = await this.db
      .selectFrom('object_ownership')
      .where('account', '=', account)
      .where('object_id', 'in', objectIds)
      .where('ownership_type', '=', ownershipType)
      .select('object_id')
      .execute();
    return [...new Set(rows.map((r) => r.object_id))];
  }

  /**
   * Per-type ownership object ids for `account` in one query (batch projection).
   */
  async findOwnershipObjectIdsByAccountGrouped(
    account: string,
    objectIds: string[],
  ): Promise<{ supervised: Set<string>; exclusive: Set<string> }> {
    const empty = { supervised: new Set<string>(), exclusive: new Set<string>() };
    if (objectIds.length === 0) {
      return empty;
    }
    const rows = await this.db
      .selectFrom('object_ownership')
      .where('account', '=', account)
      .where('object_id', 'in', objectIds)
      .select(['object_id', 'ownership_type'])
      .execute();
    const supervised = new Set<string>();
    const exclusive = new Set<string>();
    for (const row of rows) {
      if (row.ownership_type === 'supervised') {
        supervised.add(row.object_id);
      } else if (row.ownership_type === 'exclusive') {
        exclusive.add(row.object_id);
      }
    }
    return { supervised, exclusive };
  }

  async countByObjectIdAndType(
    objectId: string,
    ownershipType: ObjectOwnershipType,
  ): Promise<number> {
    try {
      const row = await this.db
        .selectFrom('object_ownership as oo')
        .innerJoin('accounts_current as ac', (join) =>
          join.onRef('oo.account', '=', 'ac.name'),
        )
        .where('oo.object_id', '=', objectId)
        .where('oo.ownership_type', '=', ownershipType)
        .select(sql<number>`count(*)::int`.as('c'))
        .executeTakeFirst();
      return Number(row?.c ?? 0);
    } catch (e) {
      this.logger.error((e as Error).message);
      return 0;
    }
  }

  /**
   * Accounts with ownership on `object_id`, joined to `accounts_current`, subscription-list sorts + pagination.
   */
  async findAccountsByObjectIdAndType(
    objectId: string,
    ownershipType: ObjectOwnershipType,
    sort: UserSubscriptionSort,
    skip: number,
    limit: number,
  ): Promise<SubscriptionJoinedAccountRow[]> {
    try {
      const qb = this.db
        .selectFrom('object_ownership as oo')
        .innerJoin('accounts_current as ac', (join) =>
          join.onRef('oo.account', '=', 'ac.name'),
        )
        .where('oo.object_id', '=', objectId)
        .where('oo.ownership_type', '=', ownershipType)
        .select([
          sql<string>`ac.name`.as('name'),
          sql<string | null>`ac.posting_json_metadata`.as('posting_json_metadata'),
          sql<string | null>`ac.json_metadata`.as('json_metadata'),
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
              ? qb.orderBy(sql`oo.created_at`, 'desc').orderBy(sql`ac.name`, 'asc')
              : qb.orderBy(sql`ac.wobjects_weight desc nulls last`).orderBy(sql`ac.name`, 'asc');

      return await ordered.offset(skip).limit(limit).execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }
}
