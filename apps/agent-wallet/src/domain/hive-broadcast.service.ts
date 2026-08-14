import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import { HasSessionService } from './has-session.service';
import { LocalKeysService } from './local-keys.service';
import { WaivioAuthSessionService } from './waivio-auth-session.service';
import {
  PendingRequestsStore,
  type BroadcastRequestState,
} from './pending-requests.store';
import { toHiveWireOperations } from './wire-operations';

@Injectable()
export class HiveBroadcastService {
  constructor(
    private readonly config: ConfigService<AgentWalletConfig, true>,
    private readonly hasSession: HasSessionService,
    private readonly localKeys: LocalKeysService,
    private readonly pending: PendingRequestsStore,
  ) {}

  getSigningMode(): 'has' | 'local' {
    return this.config.get('signingMode', { infer: true });
  }

  async broadcastStart(input: {
    ops: unknown[];
    keyType: 'posting' | 'active';
  }): Promise<{ requestId: string }> {
    if (this.getSigningMode() === 'local') {
      return this.localBroadcastStart(input);
    }

    return this.hasSession.broadcastStart(input);
  }

  broadcastStatus(
    requestId: string,
  ): BroadcastRequestState | { status: 'expired' } {
    if (this.getSigningMode() === 'local') {
      return this.localBroadcastStatus(requestId);
    }

    return this.hasSession.broadcastStatus(requestId);
  }

  private async localBroadcastStart(input: {
    ops: unknown[];
    keyType: 'posting' | 'active';
  }): Promise<{ requestId: string }> {
    const requestId = crypto.randomUUID();
    const wireOps = toHiveWireOperations(input.ops);

    this.pending.setBroadcast(requestId, {
      status: 'pending',
      expiresAt: Date.now() + 60_000,
    });

    void this.localKeys
      .broadcast({ ops: wireOps, keyType: input.keyType })
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

  private localBroadcastStatus(
    requestId: string,
  ): BroadcastRequestState | { status: 'expired' } {
    const state = this.pending.getBroadcast(requestId);
    if (!state) {
      return { status: 'expired' };
    }
    return state;
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
    hasSession: { active: boolean; account?: string; expiresAt?: number };
    waivioAuth: ReturnType<WaivioAuthSessionService['getStatus']>;
    localKeys: ReturnType<LocalKeysService['getReadiness']>;
  } {
    return {
      signingMode: this.broadcast.getSigningMode(),
      waivioApiOrigin: this.config.get('waivioApiOrigin', { infer: true }),
      hasSession: {
        active: this.hasSession.getSessionInfo() != null,
        ...(this.hasSession.getSessionInfo() ?? {}),
      },
      waivioAuth: this.waivioAuth.getStatus(),
      localKeys: this.localKeys.getReadiness(),
    };
  }
}
