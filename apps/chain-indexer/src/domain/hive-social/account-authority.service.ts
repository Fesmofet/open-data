import { Injectable, Logger } from '@nestjs/common';
import type { HiveAccountType } from '@opden-data-layer/clients';

import { UserAccountAuthsRepository } from '../../repositories/user-account-auths.repository';
import type { HiveOperationHandlerContext } from '../hive-parser/hive-handler-context';
import {
  HIVE_ACCOUNT_AUTHORITY_TYPES,
  parseAccountAuthorityCreate,
  parseAccountAuthorityFromHiveAccount,
  parseAccountAuthorityRecover,
  parseAccountAuthorityUpdate,
  type ParsedAccountAuthorityUpdate,
} from './account-authority.parse';

@Injectable()
export class AccountAuthorityService {
  private readonly logger = new Logger(AccountAuthorityService.name);

  constructor(private readonly accountAuths: UserAccountAuthsRepository) {}

  async handleAccountUpdate(
    payload: Record<string, unknown>,
    ctx?: HiveOperationHandlerContext,
  ): Promise<void> {
    const parsed = parseAccountAuthorityUpdate(payload);
    if (!parsed || !ctx) {
      return;
    }
    await this.applyPartialUpdate(parsed, ctx.blockNum);
  }

  async handleCreateAccount(
    payload: Record<string, unknown>,
    ctx?: HiveOperationHandlerContext,
  ): Promise<void> {
    const parsed = parseAccountAuthorityCreate(payload);
    if (!parsed || !ctx) {
      return;
    }
    await this.applyPartialUpdate(parsed, ctx.blockNum);
  }

  async handleRecoverAccount(
    payload: Record<string, unknown>,
    ctx?: HiveOperationHandlerContext,
  ): Promise<void> {
    const parsed = parseAccountAuthorityRecover(payload);
    if (!parsed || !ctx) {
      return;
    }
    await this.applyPartialUpdate(parsed, ctx.blockNum);
  }

  /** Full snapshot from `get_accounts` (account sync / backfill). */
  async applyFromHiveAccount(account: HiveAccountType, blockNum: number): Promise<void> {
    const parsed = parseAccountAuthorityFromHiveAccount(account);
    await this.applyFullSnapshot(parsed, blockNum);
  }

  private async applyPartialUpdate(
    parsed: ParsedAccountAuthorityUpdate,
    blockNum: number,
  ): Promise<void> {
    const { grantor, types } = parsed;
    if (!grantor) {
      return;
    }

    await this.accountAuths.runInTransaction(async (trx) => {
      let appliedAny = false;
      for (const type of HIVE_ACCOUNT_AUTHORITY_TYPES) {
        const grantees = types[type];
        if (grantees === undefined) {
          continue;
        }
        const applied = await this.accountAuths.replaceAuthorityType(
          grantor,
          type,
          grantees,
          blockNum,
          trx,
        );
        if (applied) {
          appliedAny = true;
        }
      }
      if (appliedAny) {
        await this.accountAuths.upsertSyncMark(grantor, blockNum, trx);
      }
    });
  }

  private async applyFullSnapshot(
    parsed: ParsedAccountAuthorityUpdate,
    blockNum: number,
  ): Promise<void> {
    const { grantor, types } = parsed;
    if (!grantor) {
      return;
    }

    await this.accountAuths.runInTransaction(async (trx) => {
      for (const type of HIVE_ACCOUNT_AUTHORITY_TYPES) {
        const grantees = types[type] ?? [];
        await this.accountAuths.replaceAuthorityType(
          grantor,
          type,
          grantees,
          blockNum,
          trx,
        );
      }
      await this.accountAuths.upsertSyncMark(grantor, blockNum, trx);
    });
  }
}
