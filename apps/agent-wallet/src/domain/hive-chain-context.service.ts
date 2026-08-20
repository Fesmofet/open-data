import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@hiveio/dhive';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import { HIVE_CHAIN_CONTEXT_CACHE_TTL_MS } from '../constants/hive-chain-context';

export type HiveChainContext = {
  totalVestingShares: string;
  totalVestingFundSteem: string;
};

@Injectable()
export class HiveChainContextService {
  private readonly logger = new Logger(HiveChainContextService.name);
  private client: Client | null = null;
  private cached: HiveChainContext | null = null;
  private cachedAt = 0;

  constructor(private readonly config: ConfigService<AgentWalletConfig, true>) {}

  async getChainContext(): Promise<HiveChainContext> {
    const now = Date.now();
    if (this.cached && now - this.cachedAt < HIVE_CHAIN_CONTEXT_CACHE_TTL_MS) {
      return this.cached;
    }

    const client = this.getClient();
    const props = await client.database.getDynamicGlobalProperties();
    const context: HiveChainContext = {
      totalVestingShares: String(props.total_vesting_shares),
      totalVestingFundSteem: String(props.total_vesting_fund_hive),
    };
    this.cached = context;
    this.cachedAt = now;
    return context;
  }

  clearCache(): void {
    this.cached = null;
    this.cachedAt = 0;
  }

  private getClient(): Client {
    if (!this.client) {
      this.client = new Client(this.config.get('hiveRpcNodes', { infer: true }));
    }
    return this.client;
  }
}
