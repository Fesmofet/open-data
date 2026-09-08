import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@hiveio/dhive';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import { HIVE_CHAIN_CONTEXT_CACHE_TTL_MS } from '../constants/hive-chain-context';

export type HiveChainContext = {
  totalVestingShares: string;
  totalVestingFundSteem: string;
};

export function serializeHiveJsonMetadata(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export type HiveAccountAuthorityRow = {
  name: string;
  memo_key: string;
  json_metadata: string;
  posting: {
    weight_threshold: number;
    account_auths: [string, number][];
    key_auths: [string, number][];
  };
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

  async getAccount(name: string): Promise<HiveAccountAuthorityRow | null> {
    const normalized = name.trim().toLowerCase().replace(/^@/, '');
    if (!normalized) {
      return null;
    }

    const client = this.getClient();
    const accounts = await client.database.getAccounts([normalized]);
    const row = accounts[0];
    if (!row) {
      return null;
    }

    return {
      name: row.name,
      memo_key: String(row.memo_key),
      json_metadata: serializeHiveJsonMetadata(row.json_metadata),
      posting: {
        weight_threshold: Number(row.posting.weight_threshold),
        account_auths: row.posting.account_auths.map(([account, weight]) => [
          String(account),
          Number(weight),
        ]),
        key_auths: row.posting.key_auths.map(([key, weight]) => [
          String(key),
          Number(weight),
        ]),
      },
    };
  }

  private getClient(): Client {
    if (!this.client) {
      this.client = new Client(this.config.get('hiveRpcNodes', { infer: true }));
    }
    return this.client;
  }
}
