import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { WalletExemptionRow } from '@opden-data-layer/odl-db-types';

import type { Database } from '../database';
import { KYSELY } from '../database';

@Injectable()
export class WalletExemptionsRepository {
  private readonly logger = new Logger(WalletExemptionsRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async findForViewerAndAccounts(
    viewer: string,
    accounts: readonly string[],
  ): Promise<WalletExemptionRow[]> {
    if (accounts.length === 0) {
      return [];
    }
    try {
      return await this.db
        .selectFrom('wallet_exemptions')
        .selectAll()
        .where('viewer', '=', viewer.trim().toLowerCase())
        .where('account', 'in', [...accounts])
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }

  async upsertExemption(params: {
    viewer: string;
    account: string;
    operationIndex: number;
  }): Promise<boolean> {
    try {
      await this.db
        .insertInto('wallet_exemptions')
        .values({
          viewer: params.viewer.trim().toLowerCase(),
          account: params.account.trim().toLowerCase(),
          operation_index: params.operationIndex,
        })
        .onConflict((oc) =>
          oc.columns(['viewer', 'account', 'operation_index']).doNothing(),
        )
        .execute();
      return true;
    } catch (e) {
      this.logger.error((e as Error).message);
      return false;
    }
  }

  async deleteExemption(params: {
    viewer: string;
    account: string;
    operationIndex: number;
  }): Promise<boolean> {
    try {
      const result = await this.db
        .deleteFrom('wallet_exemptions')
        .where('viewer', '=', params.viewer.trim().toLowerCase())
        .where('account', '=', params.account.trim().toLowerCase())
        .where('operation_index', '=', params.operationIndex)
        .executeTakeFirst();
      return Number(result.numDeletedRows ?? 0) >= 0;
    } catch (e) {
      this.logger.error((e as Error).message);
      return false;
    }
  }
}
