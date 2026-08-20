import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Client,
  PrivateKey,
  cryptoUtils,
} from '@hiveio/dhive';

import type { AgentWalletConfig } from '../config/agent-wallet.config';

export type LocalKeyReadiness = {
  ready: boolean;
  account?: string;
  postingReady: boolean;
  activeReady: boolean;
  memoReady: boolean;
  error?: string;
};

@Injectable()
export class LocalKeysService implements OnModuleInit {
  private readonly logger = new Logger(LocalKeysService.name);
  private postingKey: PrivateKey | null = null;
  private activeKey: PrivateKey | null = null;
  private memoKey: PrivateKey | null = null;
  private account: string | null = null;
  private client: Client | null = null;
  private memoReady = false;
  private readiness: LocalKeyReadiness = {
    ready: false,
    postingReady: false,
    activeReady: false,
    memoReady: false,
  };

  constructor(private readonly config: ConfigService<AgentWalletConfig, true>) {}

  async onModuleInit(): Promise<void> {
    await this.validateMemoKey();
    if (this.config.get('signingMode', { infer: true }) !== 'local') {
      return;
    }

    await this.validateConfiguration();
  }

  getReadiness(): LocalKeyReadiness {
    return { ...this.readiness };
  }

  isMemoReady(): boolean {
    return this.memoReady;
  }

  getMemoPrivateKey(): PrivateKey {
    if (!this.memoKey) {
      throw new Error('HIVE_MEMO_KEY is not configured or invalid');
    }
    return this.memoKey;
  }

  getRpcClient(): Client {
    if (!this.client) {
      this.client = new Client(this.config.get('hiveRpcNodes', { infer: true }));
    }
    return this.client;
  }

  async validateMemoKey(): Promise<boolean> {
    const account = this.config.get('hiveAccount', { infer: true });
    const memoWif = this.config.get('hiveMemoKey', { infer: true });

    if (!memoWif) {
      this.memoKey = null;
      this.memoReady = false;
      this.readiness = { ...this.readiness, memoReady: false };
      return false;
    }

    if (!account) {
      this.memoKey = null;
      this.memoReady = false;
      this.readiness = {
        ...this.readiness,
        memoReady: false,
        error: 'HIVE_ACCOUNT is required when HIVE_MEMO_KEY is set',
      };
      return false;
    }

    let memoKey: PrivateKey;
    try {
      memoKey = PrivateKey.fromString(memoWif);
    } catch {
      this.memoKey = null;
      this.memoReady = false;
      this.readiness = {
        ...this.readiness,
        memoReady: false,
        error: 'HIVE_MEMO_KEY is malformed',
      };
      return false;
    }

    const client = this.getRpcClient();
    const memoPub = memoKey.createPublic().toString();
    const authorized = await this.isMemoKeyAuthorized(account, memoPub, client);
    if (!authorized) {
      this.memoKey = null;
      this.memoReady = false;
      this.readiness = {
        ...this.readiness,
        account,
        memoReady: false,
        error: 'HIVE_MEMO_KEY does not match HIVE_ACCOUNT memo authority',
      };
      return false;
    }

    this.memoKey = memoKey;
    this.memoReady = true;
    this.readiness = {
      ...this.readiness,
      account,
      memoReady: true,
      error: undefined,
    };
    return true;
  }

  async validateConfiguration(): Promise<LocalKeyReadiness> {
    const account = this.config.get('hiveAccount', { infer: true });
    const postingWif = this.config.get('hivePostingKey', { infer: true });

    if (!account || !postingWif) {
      this.readiness = {
        ready: false,
        postingReady: false,
        activeReady: false,
        memoReady: this.memoReady,
        error: 'HIVE_ACCOUNT and HIVE_POSTING_KEY are required in local mode',
      };
      return this.readiness;
    }

    let postingKey: PrivateKey;
    try {
      postingKey = PrivateKey.fromString(postingWif);
    } catch {
      this.readiness = {
        ready: false,
        postingReady: false,
        activeReady: false,
        memoReady: this.memoReady,
        error: 'HIVE_POSTING_KEY is malformed',
      };
      return this.readiness;
    }

    let activeKey: PrivateKey | null = null;
    const activeWif = this.config.get('hiveActiveKey', { infer: true });
    if (activeWif) {
      try {
        activeKey = PrivateKey.fromString(activeWif);
      } catch {
        this.readiness = {
          ready: false,
          postingReady: false,
          activeReady: false,
          memoReady: this.memoReady,
          error: 'HIVE_ACTIVE_KEY is malformed',
        };
        return this.readiness;
      }
    }

    const client = this.getRpcClient();

    const postingPub = postingKey.createPublic().toString();
    const postingAuthorized = await this.isKeyAuthorized(
      account,
      postingPub,
      'posting',
      client,
    );
    if (!postingAuthorized) {
      this.readiness = {
        ready: false,
        account,
        postingReady: false,
        activeReady: false,
        memoReady: this.memoReady,
        error: 'HIVE_POSTING_KEY does not match HIVE_ACCOUNT posting authority',
      };
      return this.readiness;
    }

    let activeReady = false;
    if (activeKey) {
      const activePub = activeKey.createPublic().toString();
      activeReady = await this.isKeyAuthorized(account, activePub, 'active', client);
      if (!activeReady) {
        this.readiness = {
          ready: false,
          account,
          postingReady: true,
          activeReady: false,
          memoReady: this.memoReady,
          error: 'HIVE_ACTIVE_KEY does not match HIVE_ACCOUNT active authority',
        };
        return this.readiness;
      }
    }

    this.account = account;
    this.postingKey = postingKey;
    this.activeKey = activeKey;
    this.readiness = {
      ready: true,
      account,
      postingReady: true,
      activeReady,
      memoReady: this.memoReady,
    };
    return this.readiness;
  }

  signChallenge(message: string): { signature: string; publicKey: string } {
    if (!this.postingKey) {
      throw new Error('Local posting key is not configured');
    }

    const digest = cryptoUtils.sha256(Buffer.from(message, 'utf8'));
    return {
      signature: this.postingKey.sign(digest).toString(),
      publicKey: this.postingKey.createPublic().toString(),
    };
  }

  async broadcast(input: {
    ops: unknown[];
    keyType: 'posting' | 'active';
  }): Promise<{ transactionId: string }> {
    if (!this.client || !this.account) {
      throw new Error('Local signing is not ready');
    }

    const privateKey =
      input.keyType === 'active' ? this.activeKey : this.postingKey;
    if (!privateKey) {
      throw new Error(
        input.keyType === 'active'
          ? 'HIVE_ACTIVE_KEY is required for active operations'
          : 'HIVE_POSTING_KEY is required for posting operations',
      );
    }

    const result = await this.client.broadcast.sendOperations(
      input.ops as never,
      privateKey,
    );

    return { transactionId: result.id };
  }

  private async isMemoKeyAuthorized(
    account: string,
    publicKey: string,
    client: Client,
  ): Promise<boolean> {
    try {
      const accounts = await client.database.getAccounts([account]);
      const acc = accounts[0];
      if (!acc?.memo_key) {
        return false;
      }
      return String(acc.memo_key) === publicKey;
    } catch (error) {
      this.logger.error((error as Error).message);
      return false;
    }
  }

  private async isKeyAuthorized(
    account: string,
    publicKey: string,
    role: 'posting' | 'active',
    client: Client,
  ): Promise<boolean> {
    try {
      const accounts = await client.database.getAccounts([account]);
      const acc = accounts[0];
      if (!acc) {
        return false;
      }

      const authority = role === 'posting' ? acc.posting : acc.active;
      const entry = authority.key_auths.find(([key]) => String(key) === publicKey);
      if (!entry) {
        return false;
      }

      return Number(entry[1]) >= Number(authority.weight_threshold);
    } catch (error) {
      this.logger.error((error as Error).message);
      return false;
    }
  }
}
