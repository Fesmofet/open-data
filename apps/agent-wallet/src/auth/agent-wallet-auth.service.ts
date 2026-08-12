import { createHash, randomBytes } from 'node:crypto';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import { LocalFilesService } from '../domain/local-files.service';

@Injectable()
export class AgentWalletAuthService implements OnModuleInit {
  private readonly logger = new Logger(AgentWalletAuthService.name);
  private bearerToken = '';

  constructor(
    private readonly config: ConfigService<AgentWalletConfig, true>,
    private readonly files: LocalFilesService,
  ) {}

  async onModuleInit(): Promise<void> {
    const configured = this.config.get('bearerToken', { infer: true });
    if (configured) {
      this.bearerToken = configured;
      return;
    }

    const existing = await this.files.readTextFile(this.files.tokenPath());
    if (existing?.trim()) {
      this.bearerToken = existing.trim();
      this.logger.log(`Bearer token loaded from ${this.files.tokenPath()}`);
      return;
    }

    this.bearerToken = randomBytes(32).toString('hex');
    await this.files.writeSecretFile(
      this.files.tokenPath(),
      `${this.bearerToken}\n`,
    );
    this.logger.log(`Bearer token written to ${this.files.tokenPath()}`);
    this.logger.log(`Agent-wallet bearer token: ${this.bearerToken}`);
  }

  getBearerToken(): string {
    return this.bearerToken;
  }

  isAuthorized(header: string | undefined): boolean {
    if (!header?.startsWith('Bearer ')) {
      return false;
    }
    const token = header.slice('Bearer '.length).trim();
    return token.length > 0 && token === this.bearerToken;
  }

  createLoginChallenge(account: string): string {
    const nonce = randomBytes(16).toString('hex');
    return `ODL agent-wallet login for @${account} nonce=${nonce}`;
  }

  hashRequestId(parts: string[]): string {
    return createHash('sha256').update(parts.join(':')).digest('hex').slice(0, 16);
  }
}
