import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import { normalizeHiveAccount } from '../utils/hive-account';
import { HasSessionService } from './has-session.service';
import { LocalKeysService } from './local-keys.service';

export type ResolvedSigner = {
  mode: 'local' | 'has';
  account: string;
};

@Injectable()
export class WalletSignerResolverService {
  constructor(
    private readonly config: ConfigService<AgentWalletConfig, true>,
    private readonly localKeys: LocalKeysService,
    private readonly hasSession: HasSessionService,
  ) {}

  resolve(account?: string): ResolvedSigner {
    const normalized = account?.trim()
      ? normalizeHiveAccount(account)
      : undefined;

    if (normalized) {
      if (this.localKeys.hasAccount(normalized)) {
        return { mode: 'local', account: normalized };
      }

      const hasAccount = this.hasSession.getSessionInfo()?.account;
      if (hasAccount && hasAccount === normalized) {
        return { mode: 'has', account: normalized };
      }

      const configured = [
        ...this.localKeys.listAccounts(),
        ...(hasAccount ? [hasAccount] : []),
      ];
      const uniqueConfigured = [...new Set(configured)];
      throw new Error(
        `Account ${normalized} is not configured. Available: ${uniqueConfigured.join(', ') || '(none)'}`,
      );
    }

    const signingMode = this.config.get('signingMode', { infer: true });
    const defaultAccount = this.config.get('defaultAccount', { infer: true });
    const hasAccount = this.hasSession.getSessionInfo()?.account;

    if (signingMode === 'has') {
      if (hasAccount) {
        return { mode: 'has', account: hasAccount };
      }
      if (defaultAccount && this.localKeys.hasAccount(defaultAccount)) {
        return { mode: 'local', account: defaultAccount };
      }
    } else {
      if (defaultAccount && this.localKeys.hasAccount(defaultAccount)) {
        return { mode: 'local', account: defaultAccount };
      }
      if (hasAccount) {
        return { mode: 'has', account: hasAccount };
      }
    }

    throw new Error('No configured signing account is available');
  }
}
