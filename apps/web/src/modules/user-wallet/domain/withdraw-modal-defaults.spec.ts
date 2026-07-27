import {
  findWithdrawPair,
  resolveInitialWithdrawSymbols,
  uniqueWithdrawInputOptions,
  withdrawOutputOptions,
} from './withdraw-modal-defaults';

const tokens = [
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
    inputSymbol: 'WAIV',
    outputSymbol: 'LTC',
    balanceSymbol: 'WAIV',
    displayName: 'WAIV',
    label: 'WAIV - LTC',
    balance: '10',
    precision: 8,
    requiresExternalAddress: true,
    minimumSwapAmount: null,
    minimumReceiveAmount: null,
  },
  {
    inputSymbol: 'SWAP.HIVE',
    outputSymbol: 'HIVE',
    balanceSymbol: 'SWAP.HIVE',
    displayName: 'SWAP.HIVE',
    label: 'SWAP.HIVE',
    balance: '1',
    precision: 3,
    requiresExternalAddress: false,
    minimumSwapAmount: null,
    minimumReceiveAmount: null,
  },
] as const;

describe('withdraw-modal-defaults', () => {
  it('finds pair by input and output', () => {
    expect(findWithdrawPair(tokens, 'WAIV', 'BTC')?.outputSymbol).toBe('BTC');
    expect(findWithdrawPair(tokens, 'WAIV', 'ETH')).toBeNull();
  });

  it('resolves initial symbols from presets', () => {
    expect(resolveInitialWithdrawSymbols(tokens, 'WAIV', 'LTC')).toEqual({
      inputSymbol: 'WAIV',
      outputSymbol: 'LTC',
    });
    expect(resolveInitialWithdrawSymbols(tokens, 'BAD', 'LTC')).toEqual({
      inputSymbol: 'WAIV',
      outputSymbol: 'BTC',
    });
  });

  it('lists unique inputs and outputs per input', () => {
    expect(uniqueWithdrawInputOptions(tokens).map((o) => o.value)).toEqual([
      'WAIV',
      'SWAP.HIVE',
    ]);
    expect(withdrawOutputOptions(tokens, 'WAIV').map((o) => o.value)).toEqual([
      'BTC',
      'LTC',
    ]);
  });
});
