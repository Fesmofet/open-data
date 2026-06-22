import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  HiveClient,
  HiveNodeUnavailableError,
} from '@opden-data-layer/clients';
import { vestToHp, normalizeHiveAssetAmount } from '@opden-data-layer/core';

import { AccountsCurrentRepository, UserDelegationsRepository } from '../../repositories';
import { HiveGlobalPropertiesCache } from '../feed/hive-global-properties.cache';
import type { HiveHpDelegationsResponse } from './schemas/hive-wallet.schema';

@Injectable()
export class GetUserHiveHpDelegationsEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly userDelegations: UserDelegationsRepository,
    private readonly hiveClient: HiveClient,
    private readonly hiveGlobalProperties: HiveGlobalPropertiesCache,
  ) {}

  async execute(profileAccountName: string): Promise<HiveHpDelegationsResponse | null> {
    const accountRow = await this.accounts.findByName(profileAccountName);
    if (!accountRow) {
      return null;
    }

    const normalized = profileAccountName.trim().toLowerCase();

    try {
      const [incoming, outgoing, expirations, chainContext] = await Promise.all([
        this.userDelegations.findHpDelegationsTo(normalized),
        this.userDelegations.findHpDelegationsFrom(normalized),
        this.hiveClient.findVestingDelegationExpirationsStrict(normalized),
        this.hiveGlobalProperties.getChainContextFields(),
      ]);

      const mapIndexedRow = (row: {
        delegator: string;
        delegatee: string;
        vesting_shares: number;
        delegation_date: Date | null;
      }) => {
        const hp = vestToHp(
          row.vesting_shares,
          chainContext.totalVestingShares,
          chainContext.totalVestingFundSteem,
        );
        return {
          delegator: row.delegator,
          delegatee: row.delegatee,
          vestingShares: String(row.vesting_shares),
          hp: hp.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3,
          }),
          minDelegationTime: row.delegation_date?.toISOString() ?? '',
        };
      };

      const mapExpiration = (row: {
        delegator: string;
        vesting_shares: string | { amount: string; precision?: number };
        completion_date?: string;
      }) => {
        const vestingShares = normalizeHiveAssetAmount(row.vesting_shares);
        const hp = vestToHp(
          vestingShares,
          chainContext.totalVestingShares,
          chainContext.totalVestingFundSteem,
        );
        return {
          delegator: row.delegator,
          vestingShares,
          hp: hp.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3,
          }),
          completionDate: row.completion_date ?? '',
        };
      };

      return {
        account: profileAccountName,
        incoming: incoming.map(mapIndexedRow),
        outgoing: outgoing.map(mapIndexedRow),
        expirations: expirations.map(mapExpiration),
      };
    } catch (e) {
      if (e instanceof HiveNodeUnavailableError) {
        throw new ServiceUnavailableException('Hive node unavailable');
      }
      throw e;
    }
  }
}
