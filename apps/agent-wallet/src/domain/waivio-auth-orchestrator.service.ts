import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import { HasSessionService } from './has-session.service';
import { LocalKeysService } from './local-keys.service';
import {
  PendingRequestsStore,
  type PendingWaivioAuthRequestState,
} from './pending-requests.store';
import { WaivioAuthClientService } from './waivio-auth-client.service';
import { WaivioAuthSessionService } from './waivio-auth-session.service';
import { hasExpireToVerifyUnix } from '../utils/has-expire';

function buildHiveAuthAuthData(input: {
  username: string;
  expireUnix: number;
  challengeMessage: string;
  pubkey: string;
  signature: string;
}): string {
  return JSON.stringify({
    username: input.username,
    expire: input.expireUnix,
    challenge: input.challengeMessage,
    pubkey: input.pubkey,
    signature: input.signature,
  });
}

@Injectable()
export class WaivioAuthOrchestratorService {
  constructor(
    private readonly config: ConfigService<AgentWalletConfig, true>,
    private readonly pending: PendingRequestsStore,
    private readonly authClient: WaivioAuthClientService,
    private readonly waivioSession: WaivioAuthSessionService,
    private readonly hasSession: HasSessionService,
    private readonly localKeys: LocalKeysService,
  ) {}

  authStart(account?: string): {
    requestId: string;
    alreadyActive: boolean;
    provider: 'keychain' | 'hiveauth';
    account: string;
  } {
    const status = this.waivioSession.getStatus();
    if (status.active && status.account) {
      return {
        requestId: '',
        alreadyActive: true,
        provider: status.provider ?? 'keychain',
        account: status.account,
      };
    }

    const signingMode = this.config.get('signingMode', { infer: true });
    const normalized =
      account?.trim().replace(/^@/, '').toLowerCase() ||
      this.config.get('hiveAccount', { infer: true }) ||
      this.hasSession.getSessionInfo()?.account;

    if (!normalized) {
      throw new Error('Account is required for Waivio auth');
    }

    const requestId = crypto.randomUUID();
    const provider = signingMode === 'local' ? 'keychain' : 'hiveauth';

    this.pending.setWaivioAuth(requestId, {
      status: 'pending',
      account: normalized,
      provider,
      expiresAt: Date.now() + 60_000,
    });

    void this.runAuthFlow(requestId, normalized, provider).catch(() => {
      this.pending.updateWaivioAuth(requestId, { status: 'error' });
    });

    return {
      requestId,
      alreadyActive: false,
      provider,
      account: normalized,
    };
  }

  authStatus(
    requestId: string,
  ):
    | PendingWaivioAuthRequestState
    | { status: 'expired' }
    | { status: 'active'; account: string; provider: 'keychain' | 'hiveauth' } {
    const persisted = this.waivioSession.getStatus();
    if (persisted.active && persisted.account) {
      return {
        status: 'active',
        account: persisted.account,
        provider: persisted.provider ?? 'keychain',
      };
    }

    const state = this.pending.getWaivioAuth(requestId);
    if (!state) {
      return { status: 'expired' };
    }

    if (state.status === 'pending' && state.expiresAt <= Date.now()) {
      this.pending.updateWaivioAuth(requestId, { status: 'expired' });
      return { status: 'expired' };
    }

    return state;
  }

  async authLogout(): Promise<{ ok: true; account?: string }> {
    const account = this.waivioSession.getStatus().account;
    await this.waivioSession.logout();
    return { ok: true, ...(account ? { account } : {}) };
  }

  private async runAuthFlow(
    requestId: string,
    account: string,
    provider: 'keychain' | 'hiveauth',
  ): Promise<void> {
    const challenge = await this.authClient.createChallenge({
      provider,
      username: account,
    });

    if (provider === 'keychain') {
      const proof = this.localKeys.signChallenge(challenge.message);
      const tokens = await this.authClient.verifyKeychain({
        challengeId: challenge.challengeId,
        username: account,
        signature: proof.signature,
        signedMessage: challenge.message,
      });

      await this.waivioSession.establishSession({
        account,
        provider,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
      this.pending.updateWaivioAuth(requestId, {
        status: 'active',
        account,
        provider,
        expiresAt: Date.now() + 60_000,
      });
      return;
    }

    const hasInfo = this.hasSession.getSessionInfo();
    if (!hasInfo) {
      throw new Error(
        'No active HAS session — run has_login_start before Waivio auth in HAS mode',
      );
    }

    const hasClient = this.hasSession.getClientForChallenge();
    const session = this.hasSession.getRawSession();
    if (!hasClient || !session) {
      throw new Error('HAS session is not available for challenge signing');
    }

    const challengePending = await hasClient.startChallenge({
      session,
      challenge: {
        key_type: 'posting',
        challenge: challenge.message,
      },
    });

    const proof = await hasClient.awaitChallenge(challengePending.uuid, session);
    const authData = buildHiveAuthAuthData({
      username: account,
      expireUnix: hasExpireToVerifyUnix(session.expire),
      challengeMessage: challenge.message,
      pubkey: proof.pubkey,
      signature: proof.challenge,
    });

    const tokens = await this.authClient.verifyHiveAuth({
      challengeId: challenge.challengeId,
      username: account,
      authData,
    });

    await this.waivioSession.establishSession({
      account,
      provider,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    this.pending.updateWaivioAuth(requestId, {
      status: 'active',
      account,
      provider,
      expiresAt: Date.now() + 60_000,
    });
  }
}
