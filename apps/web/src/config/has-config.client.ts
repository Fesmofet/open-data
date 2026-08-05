import type { HasConfig } from './has-config-provider';
import { DEFAULT_HAS_WS_URL } from './has.constants';

const DEFAULT_HAS_CONFIG: HasConfig = {
  wsUrl: DEFAULT_HAS_WS_URL,
  appName: 'Waivio',
};

let clientHasConfig: HasConfig = DEFAULT_HAS_CONFIG;

export function setHasConfigClient(config: HasConfig): void {
  clientHasConfig = config;
}

export function getHasConfigClient(): HasConfig {
  return clientHasConfig;
}
