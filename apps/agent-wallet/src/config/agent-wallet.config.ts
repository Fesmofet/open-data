import { join } from 'node:path';
import { homedir } from 'node:os';

import type { AgentWalletEnv } from './env.validation';
import type { SigningMode } from '../constants/signing';
import { DEFAULT_SIGNING_MODE } from '../constants/signing';
import { defaultNotificationsWsUrl } from '../utils/notifications-ws-url';

export type AgentWalletConfig = {
  port: number;
  host: string;
  odlNetwork: 'mainnet' | 'testnet';
  odlCustomJsonId: string;
  oslCustomJsonId: string;
  hasWsUrl: string;
  hasAppName: string;
  hasWebLinkBase: string;
  waivioApiOrigin: string;
  notificationsWsUrl: string;
  signingMode: SigningMode;
  hiveAccount?: string;
  hivePostingKey?: string;
  hiveActiveKey?: string;
  hiveMemoKey?: string;
  hiveRpcNodes: string[];
  dataDir: string;
  persistSession: boolean;
  bearerToken?: string;
};

export default (): AgentWalletConfig => {
  const env = process.env as unknown as AgentWalletEnv;
  const odlNetwork = env.ODL_NETWORK ?? 'testnet';
  const waivioApiOrigin = env.WAIVIO_API_ORIGIN ?? 'https://waiviodev.com';

  return {
    port: env.PORT ?? 7500,
    host: env.HOST ?? '127.0.0.1',
    odlNetwork,
    odlCustomJsonId:
      odlNetwork === 'testnet' ? 'odl-testnet' : 'odl-mainnet',
    oslCustomJsonId:
      odlNetwork === 'testnet' ? 'osl-testnet' : 'osl-mainnet',
    hasWsUrl: env.HAS_WS_URL ?? 'wss://hive-auth.arcange.eu',
    hasAppName: env.HAS_APP_NAME ?? 'ODL Agent',
    hasWebLinkBase: env.HAS_WEB_LINK_BASE ?? 'https://waiviodev.com',
    waivioApiOrigin,
    notificationsWsUrl:
      env.NOTIFICATIONS_WS_URL?.trim() ||
      defaultNotificationsWsUrl(waivioApiOrigin),
    signingMode: env.AGENT_WALLET_SIGNING_MODE ?? DEFAULT_SIGNING_MODE,
    hiveAccount: env.HIVE_ACCOUNT?.trim().replace(/^@/, '').toLowerCase(),
    hivePostingKey: env.HIVE_POSTING_KEY?.trim(),
    hiveActiveKey: env.HIVE_ACTIVE_KEY?.trim(),
    hiveMemoKey: env.HIVE_MEMO_KEY?.trim(),
    hiveRpcNodes: env.HIVE_RPC_NODES ?? ['https://api.hive.blog'],
    dataDir: env.AGENT_WALLET_DATA_DIR ?? join(homedir(), '.odl'),
    persistSession: !(env.AGENT_WALLET_NO_PERSIST === true),
    bearerToken: env.AGENT_WALLET_BEARER_TOKEN,
  };
};
