import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import { HasSessionService } from './has-session.service';
import { LocalKeysService } from './local-keys.service';
import { NotificationsSocketService } from './notifications-socket.service';
import {
  PendingRequestsStore,
  type BroadcastRequestState,
} from './pending-requests.store';
import { WalletSignerResolverService } from './wallet-signer-resolver.service';
import { WaivioAuthSessionService } from './waivio-auth-session.service';
import { toHiveWireOperations } from './wire-operations';

@Injectable()
export class HiveBroadcastService {
  constructor(
    private readonly config: ConfigService<AgentWalletConfig, true>,
    private readonly hasSession: HasSessionService,
    private readonly localKeys: LocalKeysService,
    private readonly pending: PendingRequestsStore,
    private readonly signerResolver: WalletSignerResolverService,
  ) {}

  getSigningMode(): 'has' | 'local' {
    return this.config.get('signingMode', { infer: true });
  }

  async broadcastStart(input: {
    ops: unknown[];
    keyType: 'posting' | 'active';
    account?: string;
  }): Promise<{ requestId: string; account: string; mode: 'has' | 'local' }> {
    const resolved = this.signerResolver.resolve(input.account);
    if (resolved.mode === 'local') {
      const result = await this.localBroadcastStart({
        ...input,
        account: resolved.account,
      });
      return { ...result, account: resolved.account, mode: 'local' };
    }

    if (this.hasSession.getSessionInfo()?.account !== resolved.account) {
      throw new Error(
        `HAS session is active for a different account. Expected @${resolved.account}.`,
      );
    }

    const result = await this.hasSession.broadcastStart(input);
    return { ...result, account: resolved.account, mode: 'has' };
  }

  broadcastStatus(
    requestId: string,
  ): BroadcastRequestState | { status: 'expired' } {
    const state = this.pending.getBroadcast(requestId);
    if (!state) {
      return { status: 'expired' };
    }
    return state;
  }

  private async localBroadcastStart(input: {
    ops: unknown[];
    keyType: 'posting' | 'active';
    account: string;
  }): Promise<{ requestId: string }> {
    const requestId = crypto.randomUUID();
    const wireOps = toHiveWireOperations(input.ops);

    this.pending.setBroadcast(requestId, {
      status: 'pending',
      expiresAt: Date.now() + 60_000,
    });

    void this.localKeys
      .broadcast({
        ops: wireOps,
        keyType: input.keyType,
        account: input.account,
      })
      .then((result) => {
        this.pending.updateBroadcast(requestId, {
          status: 'signed',
          transactionId: result.transactionId,
        });
      })
      .catch((error) => {
        this.pending.updateBroadcast(requestId, {
          status: 'error',
          message: (error as Error).message,
        });
      });

    return { requestId };
  }
}

@Injectable()
export class WalletStatusService {
  constructor(
    private readonly config: ConfigService<AgentWalletConfig, true>,
    private readonly hasSession: HasSessionService,
    private readonly waivioAuth: WaivioAuthSessionService,
    private readonly localKeys: LocalKeysService,
    private readonly broadcast: HiveBroadcastService,
  ) {}

  getStatus(): {
    signingMode: 'has' | 'local';
    waivioApiOrigin: string;
    memoReady: boolean;
    hasSession: { active: boolean; account?: string; expiresAt?: number };
    waivioAuth: ReturnType<WaivioAuthSessionService['getDefaultStatus']>;
    localKeys: ReturnType<LocalKeysService['getReadiness']>;
    localAccounts: ReturnType<LocalKeysService['getAllReadiness']>;
    defaultAccount?: string;
    accountsSource: AgentWalletConfig['accountsSource'];
  } {
    return {
      signingMode: this.broadcast.getSigningMode(),
      waivioApiOrigin: this.config.get('waivioApiOrigin', { infer: true }),
      memoReady: this.localKeys.isMemoReady(),
      hasSession: {
        active: this.hasSession.getSessionInfo() != null,
        ...(this.hasSession.getSessionInfo() ?? {}),
      },
      waivioAuth: this.waivioAuth.getDefaultStatus(),
      localKeys: this.localKeys.getReadiness(),
      localAccounts: this.localKeys.getAllReadiness(),
      defaultAccount: this.config.get('defaultAccount', { infer: true }),
      accountsSource: this.config.get('accountsSource', { infer: true }),
    };
  }
}

@Injectable()
export class WalletAccountsService {
  constructor(
    private readonly config: ConfigService<AgentWalletConfig, true>,
    private readonly localKeys: LocalKeysService,
    private readonly waivioAuth: WaivioAuthSessionService,
    private readonly notificationsSocket: NotificationsSocketService,
  ) {}

  getAccounts(): {
    defaultAccount?: string;
    accountsSource: AgentWalletConfig['accountsSource'];
    accounts: Array<{
      account: string;
      postingReady: boolean;
      activeReady: boolean;
      memoReady: boolean;
      ownerReady: boolean;
      waivioAuth: {
        active: boolean;
        provider?: 'keychain' | 'hiveauth';
      };
      notifications: {
        connected: boolean;
      };
    }>;
  } {
    const readinessByAccount = new Map(
      this.localKeys.getAllReadiness().map((entry) => [
        entry.account ?? '',
        entry,
      ]),
    );
    const configured = this.config.get('accounts', { infer: true });
    const accountNames = [
      ...new Set([
        ...configured.map((entry) => entry.account),
        ...this.localKeys.listAccounts(),
      ]),
    ];

    return {
      defaultAccount: this.config.get('defaultAccount', { infer: true }),
      accountsSource: this.config.get('accountsSource', { infer: true }),
      accounts: accountNames.map((account) => {
        const readiness = readinessByAccount.get(account) ?? {
          ready: false,
          account,
          postingReady: false,
          activeReady: false,
          memoReady: false,
          ownerReady: false,
        };
        const waivioStatus = this.waivioAuth.getStatus(account);
        return {
          account,
          postingReady: readiness.postingReady,
          activeReady: readiness.activeReady,
          memoReady: readiness.memoReady,
          ownerReady: readiness.ownerReady,
          waivioAuth: {
            active: waivioStatus.active,
            ...(waivioStatus.provider ? { provider: waivioStatus.provider } : {}),
          },
          notifications: {
            connected: this.notificationsSocket.isConnected(account),
          },
        };
      }),
    };
  }
}
