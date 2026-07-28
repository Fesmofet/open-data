/** Hive `custom_json` ids for ODL/OBL envelopes (must match chain-indexer config). */
export const CUSTOM_JSON_ID = Object.freeze({
  ODL_MAINNET: 'odl-mainnet',
  ODL_TESTNET: 'odl-testnet',
  OBL_MAINNET: 'obl-mainnet',
  OBL_TESTNET: 'obl-testnet',
  OSL_MAINNET: 'osl-mainnet',
  OSL_TESTNET: 'osl-testnet',
} as const);

export type OdlNetwork = 'mainnet' | 'testnet';

export function parseOdlNetwork(value: string | undefined): OdlNetwork {
  const normalized = (value ?? 'mainnet').trim().toLowerCase();
  return normalized === 'testnet' ? 'testnet' : 'mainnet';
}

export function resolveOdlCustomJsonId(network: OdlNetwork): string {
  return network === 'testnet'
    ? CUSTOM_JSON_ID.ODL_TESTNET
    : CUSTOM_JSON_ID.ODL_MAINNET;
}

export function resolveOblCustomJsonId(network: OdlNetwork): string {
  return network === 'testnet'
    ? CUSTOM_JSON_ID.OBL_TESTNET
    : CUSTOM_JSON_ID.OBL_MAINNET;
}

export function resolveOslCustomJsonId(network: OdlNetwork): string {
  return network === 'testnet'
    ? CUSTOM_JSON_ID.OSL_TESTNET
    : CUSTOM_JSON_ID.OSL_MAINNET;
}
