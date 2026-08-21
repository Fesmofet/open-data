import { Injectable, Inject } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { Database } from '../database';
import { KYSELY } from '../database';
import type {
  NewObjectOwnership,
  ObjectOwnership,
  ObjectOwnershipType,
} from '@opden-data-layer/odl-db-types';

@Injectable()
export class ObjectOwnershipRepository {
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

  async upsert(row: NewObjectOwnership): Promise<void> {
    await this.db
      .insertInto('object_ownership')
      .values(row)
      .onConflict((oc) =>
        oc.columns(['object_id', 'account']).doUpdateSet({
          ownership_type: row.ownership_type,
          event_seq: row.event_seq,
          created_at: row.created_at,
        }),
      )
      .execute();
  }

  async delete(objectId: string, account: string): Promise<void> {
    await this.db
      .deleteFrom('object_ownership')
      .where('object_id', '=', objectId)
      .where('account', '=', account)
      .execute();
  }

  async countByObjectIdAndType(
    objectId: string,
    ownershipType: ObjectOwnershipType,
  ): Promise<number> {
    const row = await this.db
      .selectFrom('object_ownership')
      .where('object_id', '=', objectId)
      .where('ownership_type', '=', ownershipType)
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirst();
    return Number(row?.count ?? 0);
  }
}
