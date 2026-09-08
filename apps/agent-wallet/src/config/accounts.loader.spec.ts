import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { loadWalletAccounts } from './accounts.loader';
import type { AgentWalletEnv } from './env.validation';

describe('loadWalletAccounts', () => {
  const envFallback: AgentWalletEnv = {
    PORT: 7500,
    HOST: '127.0.0.1',
    ODL_NETWORK: 'testnet',
    HAS_WS_URL: 'wss://hive-auth.arcange.eu',
    HAS_APP_NAME: 'ODL Agent',
    HAS_WEB_LINK_BASE: 'https://waiviodev.com',
    WAIVIO_API_ORIGIN: 'https://waiviodev.com',
    AGENT_WALLET_SIGNING_MODE: 'has',
    HIVE_ACCOUNT: 'alice',
    HIVE_POSTING_KEY: '5JtestPostingKeyForAliceAccountOnly',
    HIVE_ACTIVE_KEY: undefined,
    HIVE_MEMO_KEY: undefined,
    HIVE_OWNER_KEY: undefined,
    HIVE_RPC_NODES: ['https://api.hive.blog'],
    AGENT_WALLET_DATA_DIR: undefined,
    AGENT_WALLET_NO_PERSIST: false,
    AGENT_WALLET_BEARER_TOKEN: undefined,
    NOTIFICATIONS_WS_URL: undefined,
    AGENT_WALLET_ACCOUNTS_FILE: undefined,
  };

  it('reads registry from JSON file and ignores env when file is valid', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agent-wallet-accounts-'));
    const filePath = join(dir, 'accounts.json');
    writeFileSync(
      filePath,
      JSON.stringify([
        { account: 'waivio.import', keys: { posting: '5Ja' } },
        { account: 'flowmaster', keys: { posting: '5Jb' } },
      ]),
    );

    const result = loadWalletAccounts(filePath, envFallback);
    expect(result.source).toBe('file');
    expect(result.accounts.map((entry) => entry.account)).toEqual([
      'waivio.import',
      'flowmaster',
    ]);
  });

  it('falls back to env when file is missing', () => {
    const result = loadWalletAccounts(
      join(tmpdir(), 'missing-accounts.json'),
      envFallback,
    );
    expect(result.source).toBe('env');
    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0]?.account).toBe('alice');
    expect(Object.keys(result.accounts[0]?.keys ?? {})).toEqual(['posting']);
  });

  it('falls back to env when JSON is syntactically broken', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agent-wallet-accounts-'));
    const filePath = join(dir, 'broken.json');
    writeFileSync(filePath, '{ broken');

    const result = loadWalletAccounts(filePath, envFallback);
    expect(result.source).toBe('env');
    expect(result.accounts[0]?.account).toBe('alice');
  });

  it('falls back to env when JSON fails schema validation', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agent-wallet-accounts-'));
    const filePath = join(dir, 'invalid.json');
    writeFileSync(filePath, JSON.stringify([{ account: 'bob', keys: {} }]));

    const result = loadWalletAccounts(filePath, envFallback);
    expect(result.source).toBe('env');
    expect(result.accounts[0]?.account).toBe('alice');
  });

  it('returns empty registry when file and env are absent', () => {
    const result = loadWalletAccounts(join(tmpdir(), 'missing.json'), {
      ...envFallback,
      HIVE_ACCOUNT: undefined,
      HIVE_POSTING_KEY: undefined,
    });
    expect(result.source).toBe('none');
    expect(result.accounts).toEqual([]);
  });

  it('normalizes account names from file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agent-wallet-accounts-'));
    const filePath = join(dir, 'accounts.json');
    writeFileSync(
      filePath,
      JSON.stringify([{ account: '@Waivio.Import', keys: { posting: '5Jx' } }]),
    );

    const result = loadWalletAccounts(filePath, envFallback);
    expect(result.accounts[0]?.account).toBe('waivio.import');
  });
});
