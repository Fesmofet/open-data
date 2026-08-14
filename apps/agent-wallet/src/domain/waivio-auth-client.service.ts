import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import { buildWaivioAuthBaseUrl } from '../utils/waivio-api-urls';

export type WaivioChallengeResponse = {
  challengeId: string;
  message: string;
  expiresAt: string;
};

export type WaivioSessionTokens = {
  accessToken: string;
  refreshToken: string;
  user: { username: string };
};

@Injectable()
export class WaivioAuthClientService {
  constructor(private readonly config: ConfigService<AgentWalletConfig, true>) {}

  private authBaseUrl(): string {
    return buildWaivioAuthBaseUrl(
      this.config.get('waivioApiOrigin', { infer: true }),
    );
  }

  async createChallenge(input: {
    provider: 'keychain' | 'hiveauth';
    username: string;
  }): Promise<WaivioChallengeResponse> {
    const response = await fetch(`${this.authBaseUrl()}/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`Waivio auth challenge failed (${response.status})`);
    }

    return (await response.json()) as WaivioChallengeResponse;
  }

  async verifyKeychain(input: {
    challengeId: string;
    username: string;
    signature: string;
    signedMessage: string;
  }): Promise<WaivioSessionTokens> {
    const response = await fetch(`${this.authBaseUrl()}/verify/keychain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`Waivio keychain verify failed (${response.status})`);
    }

    return (await response.json()) as WaivioSessionTokens;
  }

  async verifyHiveAuth(input: {
    challengeId: string;
    username: string;
    authData: string;
  }): Promise<WaivioSessionTokens> {
    const response = await fetch(`${this.authBaseUrl()}/verify/hiveauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`Waivio HiveAuth verify failed (${response.status})`);
    }

    return (await response.json()) as WaivioSessionTokens;
  }

  async refresh(refreshToken: string): Promise<WaivioSessionTokens> {
    const response = await fetch(`${this.authBaseUrl()}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error(`Waivio auth refresh failed (${response.status})`);
    }

    return (await response.json()) as WaivioSessionTokens;
  }

  async logout(refreshToken: string): Promise<void> {
    const response = await fetch(`${this.authBaseUrl()}/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error(`Waivio auth logout failed (${response.status})`);
    }
  }
}
