import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import { normalizeHiveAccount } from '../utils/hive-account';
import { HasSessionService } from './has-session.service';
import { LocalKeysService } from './local-keys.service';
import {
  PendingRequestsStore,
  type PendingWaivioAuthRequestState,
} from './pending-requests.store';
import { NotificationsSocketService } from './notifications-socket.service';
import { WalletSignerResolverService } from './wallet-signer-resolver.service';
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
    private readonly signerResolver: WalletSignerResolverService,
    private readonly notificationsSocket: NotificationsSocketService,
  ) {}

  authStart(account?: string): {
    requestId: string;
    alreadyActive: boolean;
    provider: 'keychain' | 'hiveauth';
    account: string;
  } {
    const normalized = account?.trim()
      ? normalizeHiveAccount(account)
      : this.config.get('defaultAccount', { infer: true }) ??
        this.hasSession.getSessionInfo()?.account;

    if (!normalized) {
      throw new Error('Account is required for Waivio auth');
    }

    const status = this.waivioSession.getStatus(normalized);
    if (status.active && status.account) {
      return {
        requestId: '',
        alreadyActive: true,
        provider: status.provider ?? 'keychain',
        account: status.account,
      };
    }

    const resolved = this.signerResolver.resolve(normalized);
    const requestId = crypto.randomUUID();
    const provider = resolved.mode === 'local' ? 'keychain' : 'hiveauth';

    this.pending.setWaivioAuth(requestId, {
      status: 'pending',
      account: normalized,
      provider,
      expiresAt: Date.now() + 60_000,
    });

    void this.runAuthFlow(requestId, normalized, provider, resolved.mode).catch(
      () => {
        this.pending.updateWaivioAuth(requestId, { status: 'error' });
      },
    );

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
    const state = this.pending.getWaivioAuth(requestId);
    if (!state) {
      return { status: 'expired' };
    }

    if (state.status === 'pending' && state.expiresAt <= Date.now()) {
      this.pending.updateWaivioAuth(requestId, { status: 'expired' });
      return { status: 'expired' };
    }

    if (state.status === 'active') {
      const persisted = this.waivioSession.getStatus(state.account);
      if (persisted.active && persisted.account) {
        return {
          status: 'active',
          account: persisted.account,
          provider: persisted.provider ?? 'keychain',
        };
      }
    }

    return state;
  }

  async authLogout(account?: string): Promise<{ ok: true; account?: string }> {
    const resolvedAccount = account?.trim()
      ? normalizeHiveAccount(account)
      : this.config.get('defaultAccount', { infer: true });
    await this.waivioSession.logout(resolvedAccount);
    await this.notificationsSocket.refreshConnections();
    return { ok: true, ...(resolvedAccount ? { account: resolvedAccount } : {}) };
  }

  private async runAuthFlow(
    requestId: string,
    account: string,
    provider: 'keychain' | 'hiveauth',
    signingMode: 'local' | 'has',
  ): Promise<void> {
    const challenge = await this.authClient.createChallenge({
      provider,
      username: account,
    });

    if (signingMode === 'local') {
      const proof = this.localKeys.signChallenge(challenge.message, account);
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
      await this.notificationsSocket.refreshConnections();
      this.pending.updateWaivioAuth(requestId, {
        status: 'active',
        account,
        provider,
        expiresAt: Date.now() + 60_000,
      });
      return;
    }

    const hasInfo = this.hasSession.getSessionInfo();
    if (!hasInfo || hasInfo.account !== account) {
      throw new Error(
        `No active HAS session for @${account} — run has_login_start before Waivio auth in HAS mode`,
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
    await this.notificationsSocket.refreshConnections();

    this.pending.updateWaivioAuth(requestId, {
      status: 'active',
      account,
      provider,
      expiresAt: Date.now() + 60_000,
    });
  }
}
