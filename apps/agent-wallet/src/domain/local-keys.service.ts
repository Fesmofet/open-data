import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Client,
  PrivateKey,
  cryptoUtils,
} from '@hiveio/dhive';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import type { WalletAccount } from '../config/accounts.schema';
import { normalizeHiveAccount } from '../utils/hive-account';

export type LocalKeyReadiness = {
  ready: boolean;
  account?: string;
  postingReady: boolean;
  activeReady: boolean;
  memoReady: boolean;
  ownerReady: boolean;
  error?: string;
};

type AccountKeyState = {
  postingKey: PrivateKey | null;
  activeKey: PrivateKey | null;
  memoKey: PrivateKey | null;
  ownerKey: PrivateKey | null;
  readiness: LocalKeyReadiness;
};

@Injectable()
export class LocalKeysService implements OnModuleInit {
  private readonly logger = new Logger(LocalKeysService.name);
  private readonly accounts = new Map<string, AccountKeyState>();
  private client: Client | null = null;

  constructor(private readonly config: ConfigService<AgentWalletConfig, true>) {}

  async onModuleInit(): Promise<void> {
    await this.validateAllAccounts();
  }

  listAccounts(): string[] {
    return [...this.accounts.keys()];
  }

  hasAccount(account: string): boolean {
    return this.accounts.has(normalizeHiveAccount(account));
  }

  getAllReadiness(): LocalKeyReadiness[] {
    return [...this.accounts.values()].map((state) => ({ ...state.readiness }));
  }

  getReadiness(account?: string): LocalKeyReadiness {
    const name = this.resolveAccountName(account);
    const state = name ? this.accounts.get(name) : undefined;
    if (!state) {
      return {
        ready: false,
        postingReady: false,
        activeReady: false,
        memoReady: false,
        ownerReady: false,
        error: name
          ? `Account ${name} is not configured in the local key registry`
          : 'No default account configured in the local key registry',
      };
    }
    return { ...state.readiness };
  }

  isMemoReady(account?: string): boolean {
    const name = this.resolveAccountName(account);
    if (!name) {
      return false;
    }
    return this.accounts.get(name)?.readiness.memoReady ?? false;
  }

  getMemoPrivateKey(account?: string): PrivateKey {
    const name = this.requireAccountName(account);
    const memoKey = this.accounts.get(name)?.memoKey;
    if (!memoKey) {
      throw new Error(`Memo key is not configured or invalid for @${name}`);
    }
    return memoKey;
  }

  getRpcClient(): Client {
    if (!this.client) {
      this.client = new Client(this.config.get('hiveRpcNodes', { infer: true }));
    }
    return this.client;
  }

  signChallenge(message: string, account?: string): { signature: string; publicKey: string } {
    const name = this.requireAccountName(account);
    const postingKey = this.accounts.get(name)?.postingKey;
    if (!postingKey) {
      throw new Error(`Local posting key is not configured for @${name}`);
    }

    const digest = cryptoUtils.sha256(Buffer.from(message, 'utf8'));
    return {
      signature: postingKey.sign(digest).toString(),
      publicKey: postingKey.createPublic().toString(),
    };
  }

  async broadcast(input: {
    ops: unknown[];
    keyType: 'posting' | 'active';
    account?: string;
  }): Promise<{ transactionId: string }> {
    const name = this.requireAccountName(input.account);
    const state = this.accounts.get(name);
    if (!state?.readiness.ready) {
      throw new Error(`Local signing is not ready for @${name}`);
    }

    const privateKey =
      input.keyType === 'active' ? state.activeKey : state.postingKey;
    if (!privateKey) {
      throw new Error(
        input.keyType === 'active'
          ? `Active key is required for active operations on @${name}`
          : `Posting key is required for posting operations on @${name}`,
      );
    }

    const client = this.getRpcClient();
    const result = await client.broadcast.sendOperations(
      input.ops as never,
      privateKey,
    );

    return { transactionId: result.id };
  }

  private async validateAllAccounts(): Promise<void> {
    const configured = this.config.get('accounts', { infer: true });
    this.accounts.clear();

    if (configured.length === 0) {
      return;
    }

    for (const entry of configured) {
      this.accounts.set(entry.account, this.buildInitialState(entry));
    }

    const validNames = [...this.accounts.entries()]
      .filter(([, state]) => !state.readiness.error?.includes('malformed'))
      .map(([account]) => account);

    if (validNames.length === 0) {
      return;
    }

    const client = this.getRpcClient();
    let chainAccounts: Awaited<ReturnType<Client['database']['getAccounts']>>;
    try {
      chainAccounts = await client.database.getAccounts(validNames);
    } catch (error) {
      this.logger.error((error as Error).message);
      for (const account of validNames) {
        const state = this.accounts.get(account);
        if (state) {
          state.readiness = {
            ...state.readiness,
            ready: false,
            error: 'Could not verify local keys against Hive RPC',
          };
        }
      }
      return;
    }

    const chainByName = new Map(
      chainAccounts.map((row) => [String(row.name).toLowerCase(), row]),
    );

    for (const account of validNames) {
      const state = this.accounts.get(account);
      if (!state) {
        continue;
      }
      const chainRow = chainByName.get(account);
      if (!chainRow) {
        state.readiness = {
          ...state.readiness,
          account,
          ready: false,
          error: `Hive account not found: ${account}`,
        };
        continue;
      }

      state.readiness = await this.validateAccountAgainstChain(
        account,
        state,
        chainRow,
      );
    }
  }

  private buildInitialState(entry: WalletAccount): AccountKeyState {
    const account = entry.account;
    const baseReadiness: LocalKeyReadiness = {
      ready: false,
      account,
      postingReady: false,
      activeReady: false,
      memoReady: false,
      ownerReady: false,
    };

    let postingKey: PrivateKey | null = null;
    try {
      postingKey = PrivateKey.fromString(entry.keys.posting);
    } catch {
      return {
        postingKey: null,
        activeKey: null,
        memoKey: null,
        ownerKey: null,
        readiness: {
          ...baseReadiness,
          error: `Posting key for @${account} is malformed`,
        },
      };
    }

    let activeKey: PrivateKey | null = null;
    if (entry.keys.active) {
      try {
        activeKey = PrivateKey.fromString(entry.keys.active);
      } catch {
        return {
          postingKey: null,
          activeKey: null,
          memoKey: null,
          ownerKey: null,
          readiness: {
            ...baseReadiness,
            error: `Active key for @${account} is malformed`,
          },
        };
      }
    }

    let memoKey: PrivateKey | null = null;
    if (entry.keys.memo) {
      try {
        memoKey = PrivateKey.fromString(entry.keys.memo);
      } catch {
        return {
          postingKey: null,
          activeKey: null,
          memoKey: null,
          ownerKey: null,
          readiness: {
            ...baseReadiness,
            error: `Memo key for @${account} is malformed`,
          },
        };
      }
    }

    let ownerKey: PrivateKey | null = null;
    if (entry.keys.owner) {
      try {
        ownerKey = PrivateKey.fromString(entry.keys.owner);
      } catch {
        return {
          postingKey: null,
          activeKey: null,
          memoKey: null,
          ownerKey: null,
          readiness: {
            ...baseReadiness,
            error: `Owner key for @${account} is malformed`,
          },
        };
      }
    }

    return {
      postingKey,
      activeKey,
      memoKey,
      ownerKey,
      readiness: baseReadiness,
    };
  }

  private async validateAccountAgainstChain(
    account: string,
    state: AccountKeyState,
    chainRow: Awaited<ReturnType<Client['database']['getAccounts']>>[number],
  ): Promise<LocalKeyReadiness> {
    const postingPub = state.postingKey?.createPublic().toString() ?? '';
    const postingReady = this.isKeyAuthorized(
      postingPub,
      chainRow.posting.key_auths,
      Number(chainRow.posting.weight_threshold),
    );
    if (!postingReady) {
      return {
        ready: false,
        account,
        postingReady: false,
        activeReady: false,
        memoReady: false,
        ownerReady: false,
        error: `Posting key does not match @${account} posting authority`,
      };
    }

    let activeReady = false;
    if (state.activeKey) {
      const activePub = state.activeKey.createPublic().toString();
      activeReady = this.isKeyAuthorized(
        activePub,
        chainRow.active.key_auths,
        Number(chainRow.active.weight_threshold),
      );
      if (!activeReady) {
        return {
          ready: false,
          account,
          postingReady: true,
          activeReady: false,
          memoReady: false,
          ownerReady: false,
          error: `Active key does not match @${account} active authority`,
        };
      }
    }

    let memoReady = false;
    if (state.memoKey) {
      const memoPub = state.memoKey.createPublic().toString();
      memoReady = String(chainRow.memo_key) === memoPub;
      if (!memoReady) {
        return {
          ready: false,
          account,
          postingReady: true,
          activeReady,
          memoReady: false,
          ownerReady: false,
          error: `Memo key does not match @${account} memo authority`,
        };
      }
    }

    let ownerReady = false;
    if (state.ownerKey) {
      const ownerPub = state.ownerKey.createPublic().toString();
      ownerReady = this.isKeyAuthorized(
        ownerPub,
        chainRow.owner.key_auths,
        Number(chainRow.owner.weight_threshold),
      );
    }

    return {
      ready: true,
      account,
      postingReady: true,
      activeReady,
      memoReady,
      ownerReady,
    };
  }

  private isKeyAuthorized(
    publicKey: string,
    keyAuths: readonly (readonly [unknown, unknown])[],
    weightThreshold: number,
  ): boolean {
    const entry = keyAuths.find(([key]) => String(key) === publicKey);
    if (!entry) {
      return false;
    }
    return Number(entry[1]) >= weightThreshold;
  }

  private resolveAccountName(account?: string): string | undefined {
    if (account?.trim()) {
      return normalizeHiveAccount(account);
    }
    return this.config.get('defaultAccount', { infer: true });
  }

  private requireAccountName(account?: string): string {
    const name = this.resolveAccountName(account);
    if (!name) {
      throw new Error('Account is required for local signing');
    }
    if (!this.accounts.has(name)) {
      throw new Error(`Account ${name} is not configured in the local key registry`);
    }
    return name;
  }
}
