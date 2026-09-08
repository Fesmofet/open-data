import { readFileSync } from 'node:fs';
import { Logger } from '@nestjs/common';

import { normalizeHiveAccount } from '../utils/hive-account';
import {
  walletAccountsSchema,
  type AccountsSource,
  type WalletAccount,
} from './accounts.schema';
import type { AgentWalletEnv } from './env.validation';

const logger = new Logger('WalletAccountsLoader');

export type LoadedWalletAccounts = {
  accounts: WalletAccount[];
  source: AccountsSource;
};

function buildEnvFallback(env: AgentWalletEnv): LoadedWalletAccounts {
  const account = env.HIVE_ACCOUNT?.trim().replace(/^@/, '').toLowerCase();
  const posting = env.HIVE_POSTING_KEY?.trim();

  if (!account || !posting) {
    return { accounts: [], source: 'none' };
  }

  const keys: WalletAccount['keys'] = { posting };
  const active = env.HIVE_ACTIVE_KEY?.trim();
  const memo = env.HIVE_MEMO_KEY?.trim();
  const owner = env.HIVE_OWNER_KEY?.trim();
  if (active) {
    keys.active = active;
  }
  if (memo) {
    keys.memo = memo;
  }
  if (owner) {
    keys.owner = owner;
  }

  return {
    accounts: [{ account: normalizeHiveAccount(account), keys }],
    source: 'env',
  };
}

function normalizeLoadedAccounts(accounts: WalletAccount[]): WalletAccount[] {
  return accounts.map((entry) => ({
    account: normalizeHiveAccount(entry.account),
    keys: entry.keys,
  }));
}

export function loadWalletAccounts(
  filePath: string,
  env: AgentWalletEnv,
): LoadedWalletAccounts {
  try {
    const raw = readFileSync(filePath, { encoding: 'utf8' });
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      logger.warn(
        `Could not parse accounts file ${filePath}: ${(error as Error).message}; falling back to env`,
      );
      return buildEnvFallback(env);
    }

    const result = walletAccountsSchema.safeParse(parsed);
    if (!result.success) {
      logger.warn(
        `Invalid accounts file ${filePath}: ${result.error.message}; falling back to env`,
      );
      return buildEnvFallback(env);
    }

    return {
      accounts: normalizeLoadedAccounts(result.data),
      source: 'file',
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return buildEnvFallback(env);
    }

    logger.warn(
      `Could not read accounts file ${filePath}: ${(error as Error).message}; falling back to env`,
    );
    return buildEnvFallback(env);
  }
}
