import {
  isEngineHistoryItemExcluded,
  isEngineHistoryRpcEntryExcluded,
} from './engine-wallet-history-filter';

describe('engine-wallet-history-filter', () => {
  it('flags WAIV RPC entries', () => {
    expect(
      isEngineHistoryRpcEntryExcluded({
        account: 'alice',
        symbol: 'WAIV',
        operation: 'tokens_stake',
        timestamp: 1,
        quantity: '1',
      }),
    ).toBe(true);
    expect(
      isEngineHistoryRpcEntryExcluded({
        account: 'alice',
        symbol: 'DEC',
        operation: 'tokens_transfer',
        timestamp: 1,
        quantity: '1',
      }),
    ).toBe(false);
  });

  it('keeps swap rows involving WAIV', () => {
    expect(
      isEngineHistoryItemExcluded({
        id: 'swap:1',
        timestamp: '2020-01-01T00:00:00.000Z',
        operation: 'marketpools_swapTokens',
        kind: 'swap',
        source: 'swap',
        payload: {
          symbolIn: 'WAIV',
          symbolOut: 'SWAP.HIVE',
        },
      }),
    ).toBe(false);
  });
});
