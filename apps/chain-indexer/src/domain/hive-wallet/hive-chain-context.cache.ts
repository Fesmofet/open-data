import { Injectable } from '@nestjs/common';
import { HiveClient } from '@opden-data-layer/clients';

import type { ClaimRewardChainContext } from './parse-claim-reward-notification-payload';

const CACHE_TTL_MS = 60_000;

const DEFAULT_CHAIN_CONTEXT: ClaimRewardChainContext = {
  totalVestingShares: '0',
  totalVestingFundSteem: '0',
};

@Injectable()
export class HiveChainContextCache {
  private cached: ClaimRewardChainContext | null = null;
  private expiresAt = 0;

  constructor(private readonly hiveClient: HiveClient) {}

  async getFields(): Promise<ClaimRewardChainContext> {
    const now = Date.now();
    if (this.cached != null && now < this.expiresAt) {
      return this.cached;
    }

    const props = await this.hiveClient.getDynamicGlobalProperties();
    if (!props) {
      return DEFAULT_CHAIN_CONTEXT;
    }

    this.cached = {
      totalVestingShares:
        props.total_vesting_shares ?? DEFAULT_CHAIN_CONTEXT.totalVestingShares,
      totalVestingFundSteem:
        props.total_vesting_fund_hive ??
        props.total_vesting_fund_steem ??
        DEFAULT_CHAIN_CONTEXT.totalVestingFundSteem,
    };
    this.expiresAt = now + CACHE_TTL_MS;
    return this.cached;
  }
}
