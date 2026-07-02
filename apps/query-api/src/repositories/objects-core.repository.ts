import { Injectable, Inject } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database } from '../database';
import { KYSELY } from '../database';
import type {
  ObjectsCore,
  NewObjectsCore,
  ObjectsCoreUpdate,
} from '@opden-data-layer/core';

@Injectable()
export class ObjectsCoreRepository {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async findByObjectId(objectId: string) {
    return this.db
      .selectFrom('objects_core')
      .where('object_id', '=', objectId)
      .where('status', '=', 'active')
      .selectAll()
      .executeTakeFirst();
  }

  async find(criteria: Partial<ObjectsCore>) {
    let query = this.db.selectFrom('objects_core');

    if (criteria.object_id !== undefined) {
      query =
        criteria.object_id === null
          ? query.where('object_id', 'is', null)
          : query.where('object_id', '=', criteria.object_id);
    }
    if (criteria.object_type !== undefined) {
      query =
        criteria.object_type === null
          ? query.where('object_type', 'is', null)
          : query.where('object_type', '=', criteria.object_type);
    }
    if (criteria.creator !== undefined) {
      query =
        criteria.creator === null
          ? query.where('creator', 'is', null)
          : query.where('creator', '=', criteria.creator);
    }
    if (criteria.weight !== undefined) {
      query =
        criteria.weight === null
          ? query.where('weight', 'is', null)
          : query.where('weight', '=', criteria.weight);
    }
    if (criteria.meta_group_id !== undefined) {
      query =
        criteria.meta_group_id === null
          ? query.where('meta_group_id', 'is', null)
          : query.where('meta_group_id', '=', criteria.meta_group_id);
    }
    if (criteria.transaction_id !== undefined) {
      query =
        criteria.transaction_id === null
          ? query.where('transaction_id', 'is', null)
          : query.where('transaction_id', '=', criteria.transaction_id);
    }
    if (criteria.seq !== undefined) {
      query = query.where('seq', '=', criteria.seq);
    }

    return query.where('status', '=', 'active').selectAll().execute();
  }

  async update(objectId: string, updateWith: ObjectsCoreUpdate) {
    await this.db
      .updateTable('objects_core')
      .set(updateWith)
      .where('object_id', '=', objectId)
      .execute();
  }

  async create(row: NewObjectsCore) {
    return this.db
      .insertInto('objects_core')
      .values(row)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async delete(objectId: string) {
    return this.db
      .deleteFrom('objects_core')
      .where('object_id', '=', objectId)
      .returningAll()
      .executeTakeFirst();
  }

  /** Active objects sharing the same `meta_group_id` (product group siblings). */
  async findObjectIdsByMetaGroupId(
    metaGroupId: string,
    excludeObjectId?: string,
  ): Promise<string[]> {
    const trimmed = metaGroupId.trim();
    if (!trimmed) {
      return [];
    }
    try {
      let q = this.db
        .selectFrom('objects_core')
        .where('status', '=', 'active')
        .where('meta_group_id', '=', trimmed)
        .select('object_id');
      if (excludeObjectId?.trim()) {
        q = q.where('object_id', '<>', excludeObjectId.trim());
      }
      const rows = await q.execute();
      return rows.map((r) => r.object_id);
    } catch {
      return [];
    }
  }

  /** Objects that relisted `targetObjectId` via `status` update `{ title: relisted, link }`. */
  async findRelistingObjectIds(targetObjectId: string): Promise<string[]> {
    const target = targetObjectId.trim();
    if (!target) {
      return [];
    }
    try {
      const rows = await this.db
        .selectFrom('object_updates as ou')
        .innerJoin('objects_core as oc', 'oc.object_id', 'ou.object_id')
        .where('oc.status', '=', 'active')
        .where('ou.update_type', '=', 'status')
        .where(sql<boolean>`ou.value_json->>'title' = 'relisted'`)
        .where((eb) =>
          eb.or([
            eb(sql`ou.value_json->>'link'`, '=', target),
            eb('ou.value_text', '=', target),
          ]),
        )
        .select('ou.object_id')
        .distinct()
        .execute();
      return rows.map((r) => r.object_id);
    } catch {
      return [];
    }
  }
}
