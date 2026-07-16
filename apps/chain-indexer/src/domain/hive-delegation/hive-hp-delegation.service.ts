import { hiveBlockTimestampToDate } from '@opden-data-layer/core';
import { Injectable, Logger } from '@nestjs/common';
import { UserDelegationsRepository } from '../../repositories/user-delegations.repository';
import type { HiveOperationHandlerContext } from '../hive-parser/hive-handler-context';
import {
  normalizeHiveAccountName,
  parseVestingSharesFromOperation,
} from './parse-vesting-shares';

export type DelegateVestingSharesPayload = {
  delegator?: string;
  delegatee?: string;
  vesting_shares?: string | number;
};

@Injectable()
export class HiveHpDelegationService {
  private readonly logger = new Logger(HiveHpDelegationService.name);

  constructor(private readonly userDelegations: UserDelegationsRepository) {}

  async handleDelegateVestingShares(
    payload: DelegateVestingSharesPayload,
    context: HiveOperationHandlerContext,
  ): Promise<void> {
    const delegator = normalizeHiveAccountName(payload.delegator ?? '');
    const delegatee = normalizeHiveAccountName(payload.delegatee ?? '');
    if (delegator === '' || delegatee === '') {
      this.logger.warn('delegate_vesting_shares missing delegator or delegatee');
      return;
    }

    const vestingShares = parseVestingSharesFromOperation(payload.vesting_shares);
    if (vestingShares <= 0) {
      await this.userDelegations.deleteHpDelegation(delegator, delegatee);
      return;
    }

    await this.userDelegations.upsertHpDelegation({
      delegator,
      delegatee,
      vesting_shares: vestingShares,
      delegation_date: hiveBlockTimestampToDate(context.timestamp),
    });
  }
}
