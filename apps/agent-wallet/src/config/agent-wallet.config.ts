import { join } from 'node:path';
import { homedir } from 'node:os';

import type { AgentWalletEnv } from './env.validation';

export type AgentWalletConfig = {
  port: number;
  host: string;
  odlNetwork: 'mainnet' | 'testnet';
  odlCustomJsonId: string;
  hasWsUrl: string;
  hasAppName: string;
  hasWebLinkBase: string;
  dataDir: string;
  persistSession: boolean;
  bearerToken?: string;
};

export default (): AgentWalletConfig => {
  const env = process.env as unknown as AgentWalletEnv;
  const odlNetwork = env.ODL_NETWORK ?? 'testnet';

  return {
    port: env.PORT ?? 7500,
    host: env.HOST ?? '127.0.0.1',
    odlNetwork,
    odlCustomJsonId:
      odlNetwork === 'testnet' ? 'odl-testnet' : 'odl-mainnet',
    hasWsUrl: env.HAS_WS_URL ?? 'wss://hive-auth.arcange.eu',
    hasAppName: env.HAS_APP_NAME ?? 'ODL Agent',
    hasWebLinkBase: env.HAS_WEB_LINK_BASE ?? 'https://waiviodev.com',
    dataDir: env.AGENT_WALLET_DATA_DIR ?? join(homedir(), '.odl'),
    persistSession: !(env.AGENT_WALLET_NO_PERSIST === true),
    bearerToken: env.AGENT_WALLET_BEARER_TOKEN,
  };
};
