import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import { WAIVIO_ACCESS_REFRESH_SKEW_MS } from '../constants/waivio-auth';
import { LocalFilesService } from './local-files.service';
import { WaivioAuthClientService } from './waivio-auth-client.service';

type PersistedWaivioAuthSession = {
  account: string;
  provider: 'keychain' | 'hiveauth';
  refreshToken: string;
};

type AccessTokenState = {
  token: string;
  expiresAtMs: number;
};

@Injectable()
export class WaivioAuthSessionService implements OnModuleInit {
  private readonly logger = new Logger(WaivioAuthSessionService.name);
  private persisted: PersistedWaivioAuthSession | null = null;
  private access: AccessTokenState | null = null;

  constructor(
    private readonly config: ConfigService<AgentWalletConfig, true>,
    private readonly files: LocalFilesService,
    private readonly authClient: WaivioAuthClientService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.config.get('persistSession', { infer: true })) {
      return;
    }

    const raw = await this.files.readTextFile(
      this.files.waivioAuthSessionPath(),
    );
    if (!raw?.trim()) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedWaivioAuthSession;
      if (parsed.account && parsed.provider && parsed.refreshToken) {
        this.persisted = parsed;
        this.logger.log(`Restored Waivio auth session for @${parsed.account}`);
      }
    } catch (error) {
      this.logger.warn(
        `Could not restore Waivio auth session: ${(error as Error).message}`,
      );
    }
  }

  getStatus(): {
    active: boolean;
    account?: string;
    provider?: 'keychain' | 'hiveauth';
    accessExpiresAt?: number;
  } {
    if (!this.persisted) {
      return { active: false };
    }

    return {
      active: true,
      account: this.persisted.account,
      provider: this.persisted.provider,
      ...(this.access ? { accessExpiresAt: this.access.expiresAtMs } : {}),
    };
  }

  async establishSession(input: {
    account: string;
    provider: 'keychain' | 'hiveauth';
    accessToken: string;
    refreshToken: string;
    accessExpiresInSec?: number;
  }): Promise<void> {
    const account = input.account.trim().replace(/^@/, '').toLowerCase();
    this.persisted = {
      account,
      provider: input.provider,
      refreshToken: input.refreshToken,
    };
    this.access = {
      token: input.accessToken,
      expiresAtMs:
        Date.now() +
        (input.accessExpiresInSec ?? 15 * 60) * 1000,
    };

    if (this.config.get('persistSession', { infer: true })) {
      await this.files.writeSecretFileAtomic(
        this.files.waivioAuthSessionPath(),
        `${JSON.stringify(this.persisted)}\n`,
      );
    }
  }

  async getAccessToken(forceRefresh = false): Promise<string> {
    if (!this.persisted) {
      throw new Error('Waivio auth session is not active');
    }

    if (
      !forceRefresh &&
      this.access &&
      this.access.expiresAtMs - Date.now() > WAIVIO_ACCESS_REFRESH_SKEW_MS
    ) {
      return this.access.token;
    }

    const refreshed = await this.authClient.refresh(this.persisted.refreshToken);
    await this.rotateTokens(refreshed);
    return refreshed.accessToken;
  }

  private async rotateTokens(tokens: {
    accessToken: string;
    refreshToken: string;
  }): Promise<void> {
    if (!this.persisted) {
      return;
    }

    this.persisted = {
      ...this.persisted,
      refreshToken: tokens.refreshToken,
    };
    this.access = {
      token: tokens.accessToken,
      expiresAtMs: Date.now() + 15 * 60 * 1000,
    };

    if (this.config.get('persistSession', { infer: true })) {
      await this.files.writeSecretFileAtomic(
        this.files.waivioAuthSessionPath(),
        `${JSON.stringify(this.persisted)}\n`,
      );
    }
  }

  async logout(): Promise<void> {
    if (this.persisted?.refreshToken) {
      try {
        await this.authClient.logout(this.persisted.refreshToken);
      } catch (error) {
        this.logger.warn(
          `Waivio logout request failed: ${(error as Error).message}`,
        );
      }
    }

    this.persisted = null;
    this.access = null;

    if (this.config.get('persistSession', { infer: true })) {
      await this.files.deleteFile(this.files.waivioAuthSessionPath());
    }
  }
}
