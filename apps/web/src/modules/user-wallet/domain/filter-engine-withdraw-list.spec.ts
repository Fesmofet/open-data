import { filterEngineWithdrawList } from './filter-engine-withdraw-list';

describe('filterEngineWithdrawList', () => {
  it('removes WAIV to ETH and SWAP.ETH direct routes', () => {
    const filtered = filterEngineWithdrawList({
      account: 'alice',
      tokens: [
        {
          inputSymbol: 'WAIV',
          outputSymbol: 'ETH',
          balanceSymbol: 'WAIV',
          displayName: 'WAIV',
          label: 'WAIV - ETH',
          balance: '10',
          precision: 8,
          requiresExternalAddress: true,
          minimumSwapAmount: null,
          minimumReceiveAmount: null,
        },
        {
          inputSymbol: 'WAIV',
          outputSymbol: 'BTC',
          balanceSymbol: 'WAIV',
          displayName: 'WAIV',
          label: 'WAIV - BTC',
          balance: '10',
          precision: 8,
          requiresExternalAddress: true,
          minimumSwapAmount: null,
          minimumReceiveAmount: null,
        },
        {
          inputSymbol: 'SWAP.ETH',
          outputSymbol: 'ETH',
          balanceSymbol: 'SWAP.ETH',
          displayName: 'SWAP.ETH',
          label: 'SWAP.ETH',
          balance: '1',
          precision: 8,
          requiresExternalAddress: true,
          minimumSwapAmount: null,
          minimumReceiveAmount: null,
        },
      ],
    });

    expect(filtered.tokens.map((token) => `${token.inputSymbol}:${token.outputSymbol}`)).toEqual([
      'WAIV:BTC',
    ]);
  });
});
