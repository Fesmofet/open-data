import {
  CUSTOM_JSON_ID,
  parseOdlNetwork,
  resolveOblCustomJsonId,
  resolveOdlCustomJsonId,
} from './odl-network';

describe('odl-network', () => {
  it.each([
    [undefined, 'mainnet'],
    ['mainnet', 'mainnet'],
    ['MAINNET', 'mainnet'],
    ['testnet', 'testnet'],
    [' invalid ', 'mainnet'],
  ] as const)('parseOdlNetwork(%j) → %s', (input, expected) => {
    expect(parseOdlNetwork(input)).toBe(expected);
  });

  it('resolveOdlCustomJsonId matches chain-indexer ids', () => {
    expect(resolveOdlCustomJsonId('mainnet')).toBe(CUSTOM_JSON_ID.ODL_MAINNET);
    expect(resolveOdlCustomJsonId('testnet')).toBe(CUSTOM_JSON_ID.ODL_TESTNET);
  });

  it('resolveOblCustomJsonId matches chain-indexer ids', () => {
    expect(resolveOblCustomJsonId('mainnet')).toBe(CUSTOM_JSON_ID.OBL_MAINNET);
    expect(resolveOblCustomJsonId('testnet')).toBe(CUSTOM_JSON_ID.OBL_TESTNET);
  });
});
