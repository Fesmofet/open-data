import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type {
  HiveAccountAuthorityType,
  NewUserAccountAuth,
  NewUserAccountAuthSync,
} from '@opden-data-layer/odl-db-types';

import type { Database } from '../database';
import { KYSELY } from '../database';
import { shouldApplyAuthorityReplace } from '../domain/hive-social/account-authority-guard';

export type DbExecutor = Kysely<Database>;

@Injectable()
export class UserAccountAuthsRepository {
  private readonly logger = new Logger(UserAccountAuthsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  executor(trx?: DbExecutor): DbExecutor {
    return trx ?? this.db;
  }

  async runInTransaction<T>(fn: (trx: DbExecutor) => Promise<T>): Promise<T> {
    return this.db.transaction().execute(fn);
  }

  async maxUpdatedBlock(
    grantor: string,
    authorityType: HiveAccountAuthorityType,
    trx?: DbExecutor,
  ): Promise<number | null> {
    try {
      const row = await this.executor(trx)
        .selectFrom('user_account_auths')
        .select((eb) => eb.fn.max('updated_at_block').as('max_block'))
        .where('grantor', '=', grantor)
        .where('authority_type', '=', authorityType)
        .executeTakeFirst();
      const maxBlock = row?.max_block;
      if (maxBlock === null || maxBlock === undefined) {
        return null;
      }
      return Number(maxBlock);
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  /**
   * Replace all grantees for one authority type when incoming block is not stale.
   * @returns true when replace was applied.
   */
  async replaceAuthorityType(
    grantor: string,
    authorityType: HiveAccountAuthorityType,
    grantees: string[],
    blockNum: number,
    trx?: DbExecutor,
  ): Promise<boolean> {
    try {
      const maxBlock = await this.maxUpdatedBlock(grantor, authorityType, trx);
      if (!shouldApplyAuthorityReplace(blockNum, maxBlock)) {
        return false;
      }

      await this.executor(trx)
        .deleteFrom('user_account_auths')
        .where('grantor', '=', grantor)
        .where('authority_type', '=', authorityType)
        .where('updated_at_block', '<=', blockNum)
        .execute();

      if (grantees.length > 0) {
        const rows: NewUserAccountAuth[] = grantees.map((grantee) => ({
          grantor,
          authority_type: authorityType,
          grantee,
          updated_at_block: blockNum,
        }));
        await this.executor(trx)
          .insertInto('user_account_auths')
          .values(rows)
          .execute();
      }
      return true;
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async upsertSyncMark(
    account: string,
    syncedBlock: number,
    trx?: DbExecutor,
  ): Promise<void> {
    try {
      const row: NewUserAccountAuthSync = {
        account,
        synced_at: new Date(),
        synced_block: syncedBlock,
      };
      await this.executor(trx)
        .insertInto('user_account_auth_sync')
        .values(row)
        .onConflict((oc) =>
          oc.column('account').doUpdateSet({
            synced_at: row.synced_at,
            synced_block: sql`GREATEST(user_account_auth_sync.synced_block, ${syncedBlock})`,
          }),
        )
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }
}
