import { hiveBlockTimestampToDate } from '@opden-data-layer/core';
import { Injectable, Logger } from '@nestjs/common';
import { UserDelegationsRepository } from '../../repositories/user-delegations.repository';
import type { HiveOperationHandlerContext } from '../hive-parser/hive-handler-context';
import { NotificationEmitterService } from '../notification-adapter/notification-emitter.service';
import {
  normalizeHiveAccountName,
  parseVestingSharesFromOperation,
} from './parse-vesting-shares';

export type DelegateVestingSharesPayload = {
  delegator?: string;
  delegatee?: string;
  vesting_shares?: string | number;
};

function formatVestingSharesAmount(
  vestingShares: number,
  raw: string | number | undefined,
): string {
  if (typeof raw === 'string' && raw.trim().endsWith('VESTS')) {
    const parts = raw.trim().split(/\s+/);
    return `${parts[0] ?? String(vestingShares)} VESTS`;
  }
  return `${vestingShares} VESTS`;
}

@Injectable()
export class HiveHpDelegationService {
  private readonly logger = new Logger(HiveHpDelegationService.name);

  constructor(
    private readonly userDelegations: UserDelegationsRepository,
    private readonly notificationEmitter: NotificationEmitterService,
  ) {}

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
      this.notificationEmitter.emitWithContext(
        this.notificationEmitter.hiveContext(context),
        {
          type: 'hp_delegation',
          objectId: null,
          actor: delegator,
          payload: {
            delegator,
            delegatee,
            amount: '0',
          },
        },
      );
      return;
    }

    await this.userDelegations.upsertHpDelegation({
      delegator,
      delegatee,
      vesting_shares: vestingShares,
      delegation_date: hiveBlockTimestampToDate(context.timestamp),
    });

    this.notificationEmitter.emitWithContext(
      this.notificationEmitter.hiveContext(context),
      {
        type: 'hp_delegation',
        objectId: null,
        actor: delegator,
        payload: {
          delegator,
          delegatee,
          amount: formatVestingSharesAmount(vestingShares, payload.vesting_shares),
        },
      },
    );
  }
}
