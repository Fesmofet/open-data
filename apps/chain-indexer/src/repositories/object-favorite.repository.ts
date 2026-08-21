import { Injectable, Inject } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Database } from '../database';
import { KYSELY } from '../database';
import type { NewObjectFavorite, ObjectFavorite } from '@opden-data-layer/odl-db-types';

@Injectable()
export class ObjectFavoriteRepository {
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

  async upsert(row: NewObjectFavorite): Promise<void> {
    await this.db
      .insertInto('object_favorite')
      .values(row)
      .onConflict((oc) =>
        oc.columns(['object_id', 'account']).doUpdateSet({
          event_seq: row.event_seq,
          created_at: row.created_at,
        }),
      )
      .execute();
  }

  async delete(objectId: string, account: string): Promise<void> {
    await this.db
      .deleteFrom('object_favorite')
      .where('object_id', '=', objectId)
      .where('account', '=', account)
      .execute();
  }

  async exists(objectId: string, account: string): Promise<boolean> {
    const row = await this.db
      .selectFrom('object_favorite')
      .where('object_id', '=', objectId)
      .where('account', '=', account)
      .select('object_id')
      .executeTakeFirst();
    return row != null;
  }

  /**
   * Whether `account` has a favorite on any object created by `creator` (optionally excluding one object).
   */
  async hasFavoriteByAccountForCreator(
    account: string,
    creator: string,
    excludeObjectId?: string,
  ): Promise<boolean> {
    let query = this.db
      .selectFrom('object_favorite as of')
      .innerJoin('objects_core as oc', 'oc.object_id', 'of.object_id')
      .where('of.account', '=', account)
      .where('oc.creator', '=', creator)
      .select('of.object_id');

    if (excludeObjectId !== undefined) {
      query = query.where('of.object_id', '!=', excludeObjectId);
    }

    const row = await query.executeTakeFirst();
    return row != null;
  }
}
