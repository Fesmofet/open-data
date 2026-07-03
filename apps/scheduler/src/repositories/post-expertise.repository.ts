import { Inject, Injectable } from '@nestjs/common';
import { sql, type Kysely, type Transaction } from 'kysely';
import type { Post, PostExpertiseDelta } from '@opden-data-layer/core';
import { KYSELY, type Database } from '../database';

type DbExecutor = Kysely<Database> | Transaction<Database>;

@Injectable()
export class PostExpertiseRepository {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  private executor(trx?: Transaction<Database>): DbExecutor {
    return trx ?? this.db;
  }

  async findRootPostsPendingExpertise(limit: number): Promise<Post[]> {
    return this.db
      .selectFrom('posts')
      .selectAll()
      .where((eb) =>
        eb.or([eb('depth', '=', 0), eb('depth', 'is', null)]),
      )
      .where('rewards_finalized_at', 'is not', null)
      .where('expertise_applied_at', 'is', null)
      .orderBy('rewards_finalized_at', 'asc')
      .orderBy('author', 'asc')
      .orderBy('permlink', 'asc')
      .limit(limit)
      .execute();
  }

  async claimExpertiseApplied(
    author: string,
    permlink: string,
    trx: Transaction<Database>,
  ): Promise<Post | undefined> {
    return trx
      .updateTable('posts')
      .set({ expertise_applied_at: new Date().toISOString() })
      .where('author', '=', author)
      .where('permlink', '=', permlink)
      .where('expertise_applied_at', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  async applyExpertiseIncrements(
    account: string,
    deltas: PostExpertiseDelta[],
    trx: Transaction<Database>,
  ): Promise<void> {
    if (deltas.length === 0) {
      return;
    }

    let accountTotal = 0;
    for (const { objectId, delta } of deltas) {
      accountTotal += delta;
      await trx
        .insertInto('user_object_expertise')
        .values({
          account,
          object_id: objectId,
          weight: delta,
          updated_at: new Date().toISOString(),
        })
        .onConflict((oc) =>
          oc.columns(['account', 'object_id']).doUpdateSet({
            weight: sql`user_object_expertise.weight + ${delta}`,
            updated_at: new Date().toISOString(),
          }),
        )
        .execute();

      await trx
        .updateTable('objects_core')
        .set({
          weight: sql`COALESCE(objects_core.weight, 0) + ${delta}`,
        })
        .where('object_id', '=', objectId)
        .execute();
    }

    await trx
      .updateTable('accounts_current')
      .set({
        wobjects_weight: sql`accounts_current.wobjects_weight + ${accountTotal}`,
      })
      .where('name', '=', account)
      .execute();
  }
}
