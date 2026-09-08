import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import { WAIVIO_ACCESS_REFRESH_SKEW_MS } from '../constants/waivio-auth';
import { normalizeHiveAccount } from '../utils/hive-account';
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

export type WaivioAuthStatus = {
  active: boolean;
  account?: string;
  provider?: 'keychain' | 'hiveauth';
  accessExpiresAt?: number;
};

@Injectable()
export class WaivioAuthSessionService implements OnModuleInit {
  private readonly logger = new Logger(WaivioAuthSessionService.name);
  private readonly persisted = new Map<string, PersistedWaivioAuthSession>();
  private readonly access = new Map<string, AccessTokenState>();

  constructor(
    private readonly config: ConfigService<AgentWalletConfig, true>,
    private readonly files: LocalFilesService,
    private readonly authClient: WaivioAuthClientService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.config.get('persistSession', { infer: true })) {
      return;
    }

    await this.migrateLegacySessionFile();
    await this.loadPersistedSessions();
  }

  getStatus(account?: string): WaivioAuthStatus {
    const name = this.resolveAccountName(account);
    if (!name) {
      return { active: false };
    }

    const persisted = this.persisted.get(name);
    if (!persisted) {
      return { active: false };
    }

    const access = this.access.get(name);
    return {
      active: true,
      account: persisted.account,
      provider: persisted.provider,
      ...(access ? { accessExpiresAt: access.expiresAtMs } : {}),
    };
  }

  getAllStatuses(): WaivioAuthStatus[] {
    return [...this.persisted.keys()].map((account) => this.getStatus(account));
  }

  getDefaultStatus(): WaivioAuthStatus {
    const defaultAccount = this.config.get('defaultAccount', { infer: true });
    if (!defaultAccount) {
      return { active: false };
    }
    return this.getStatus(defaultAccount);
  }

  async establishSession(input: {
    account: string;
    provider: 'keychain' | 'hiveauth';
    accessToken: string;
    refreshToken: string;
    accessExpiresInSec?: number;
  }): Promise<void> {
    const account = normalizeHiveAccount(input.account);
    this.persisted.set(account, {
      account,
      provider: input.provider,
      refreshToken: input.refreshToken,
    });
    this.access.set(account, {
      token: input.accessToken,
      expiresAtMs:
        Date.now() +
        (input.accessExpiresInSec ?? 15 * 60) * 1000,
    });

    if (this.config.get('persistSession', { infer: true })) {
      await this.files.ensureWaivioAuthDir();
      await this.files.writeSecretFileAtomic(
        this.files.waivioAuthSessionPath(account),
        `${JSON.stringify(this.persisted.get(account))}\n`,
      );
    }
  }

  async getAccessToken(account?: string, forceRefresh = false): Promise<string> {
    const name = this.requireAccountName(account);
    const persisted = this.persisted.get(name);
    if (!persisted) {
      throw new Error(`Waivio auth session is not active for @${name}`);
    }

    const cached = this.access.get(name);
    if (
      !forceRefresh &&
      cached &&
      cached.expiresAtMs - Date.now() > WAIVIO_ACCESS_REFRESH_SKEW_MS
    ) {
      return cached.token;
    }

    const refreshed = await this.authClient.refresh(persisted.refreshToken);
    await this.rotateTokens(name, refreshed);
    return refreshed.accessToken;
  }

  async logout(account?: string): Promise<void> {
    const name = this.resolveAccountName(account);
    if (!name) {
      return;
    }

    const persisted = this.persisted.get(name);
    if (persisted?.refreshToken) {
      try {
        await this.authClient.logout(persisted.refreshToken);
      } catch (error) {
        this.logger.warn(
          `Waivio logout request failed for @${name}: ${(error as Error).message}`,
        );
      }
    }

    this.persisted.delete(name);
    this.access.delete(name);

    if (this.config.get('persistSession', { infer: true })) {
      await this.files.deleteFile(this.files.waivioAuthSessionPath(name));
    }
  }

  private async rotateTokens(
    account: string,
    tokens: { accessToken: string; refreshToken: string },
  ): Promise<void> {
    const persisted = this.persisted.get(account);
    if (!persisted) {
      return;
    }

    this.persisted.set(account, {
      ...persisted,
      refreshToken: tokens.refreshToken,
    });
    this.access.set(account, {
      token: tokens.accessToken,
      expiresAtMs: Date.now() + 15 * 60 * 1000,
    });

    if (this.config.get('persistSession', { infer: true })) {
      await this.files.writeSecretFileAtomic(
        this.files.waivioAuthSessionPath(account),
        `${JSON.stringify(this.persisted.get(account))}\n`,
      );
    }
  }

  private async migrateLegacySessionFile(): Promise<void> {
    const legacyPath = this.files.legacyWaivioAuthSessionPath();
    const raw = await this.files.readTextFile(legacyPath);
    if (!raw?.trim()) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedWaivioAuthSession;
      if (!parsed.account || !parsed.provider || !parsed.refreshToken) {
        return;
      }

      const account = normalizeHiveAccount(parsed.account);
      await this.files.ensureWaivioAuthDir();
      await this.files.writeSecretFileAtomic(
        this.files.waivioAuthSessionPath(account),
        `${JSON.stringify({ ...parsed, account })}\n`,
      );
      await this.files.deleteFile(legacyPath);
      this.logger.log(`Migrated Waivio auth session for @${account}`);
    } catch (error) {
      this.logger.warn(
        `Could not migrate legacy Waivio auth session: ${(error as Error).message}`,
      );
    }
  }

  private async loadPersistedSessions(): Promise<void> {
    const accounts = await this.files.listWaivioAuthAccounts();
    for (const account of accounts) {
      const raw = await this.files.readTextFile(
        this.files.waivioAuthSessionPath(account),
      );
      if (!raw?.trim()) {
        continue;
      }

      try {
        const parsed = JSON.parse(raw) as PersistedWaivioAuthSession;
        if (parsed.account && parsed.provider && parsed.refreshToken) {
          this.persisted.set(normalizeHiveAccount(parsed.account), parsed);
          this.logger.log(
            `Restored Waivio auth session for @${normalizeHiveAccount(parsed.account)}`,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Could not restore Waivio auth session for @${account}: ${(error as Error).message}`,
        );
      }
    }
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
      throw new Error('Account is required for Waivio auth');
    }
    return name;
  }
}
