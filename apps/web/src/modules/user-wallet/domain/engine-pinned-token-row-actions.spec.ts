import {
  buildEnginePinnedTokenQuickActions,
  peggedSwapWithdrawL1Symbol,
  shouldShowEnginePinnedTokenQuickActions,
} from './engine-pinned-token-row-actions';
import type { EngineTokenBalanceRowView } from './types/engine-wallet-view';

function pinnedToken(
  overrides: Partial<EngineTokenBalanceRowView> = {},
): EngineTokenBalanceRowView {
  return {
    symbol: 'SWAP.HIVE',
    name: 'SWAP.HIVE',
    iconUrl: null,
    balance: '579.423',
    stake: '0',
    stakingEnabled: false,
    precision: 8,
    usdEstimate: 23.46,
    isPinned: true,
    unstakingCooldown: 0,
    numberTransactions: 0,
    ...overrides,
  };
}

describe('peggedSwapWithdrawL1Symbol', () => {
  it('maps pinned SWAP symbols to L1 withdraw outputs', () => {
    expect(peggedSwapWithdrawL1Symbol('SWAP.HIVE')).toBe('HIVE');
    expect(peggedSwapWithdrawL1Symbol('SWAP.LTC')).toBe('LTC');
    expect(peggedSwapWithdrawL1Symbol('SWAP.BTC')).toBe('BTC');
  });

  it('rejects disabled pegged symbols', () => {
    expect(peggedSwapWithdrawL1Symbol('SWAP.ETH')).toBeNull();
  });
});

describe('shouldShowEnginePinnedTokenQuickActions', () => {
  it('shows quick actions for owner with positive liquid pinned balance', () => {
    expect(
      shouldShowEnginePinnedTokenQuickActions(pinnedToken(), true),
    ).toBe(true);
  });

  it('hides quick actions for non-owner', () => {
    expect(
      shouldShowEnginePinnedTokenQuickActions(pinnedToken(), false),
    ).toBe(false);
  });

  it('hides quick actions at zero liquid balance', () => {
    expect(
      shouldShowEnginePinnedTokenQuickActions(
        pinnedToken({ balance: '0', stake: '100' }),
        true,
      ),
    ).toBe(false);
  });

  it('hides quick actions for non-pinned tokens', () => {
    expect(
      shouldShowEnginePinnedTokenQuickActions(
        pinnedToken({ isPinned: false, balance: '10' }),
        true,
      ),
    ).toBe(false);
  });

  it('treats minimal positive liquid balance as actionable', () => {
    expect(
      shouldShowEnginePinnedTokenQuickActions(
        pinnedToken({ balance: '0.00000001' }),
        true,
      ),
    ).toBe(true);
  });

  it('treats malformed balance as non-actionable', () => {
    expect(
      shouldShowEnginePinnedTokenQuickActions(
        pinnedToken({ balance: '' }),
        true,
      ),
    ).toBe(false);
    expect(
      shouldShowEnginePinnedTokenQuickActions(
        pinnedToken({ balance: 'abc' }),
        true,
      ),
    ).toBe(false);
  });
});

describe('buildEnginePinnedTokenQuickActions', () => {
  it('builds swap-to-WAIV primary and menu presets', () => {
    const swapCalls: Array<{ fromSymbol?: string; toSymbol?: string }> = [];
    const withdrawCalls: Array<{ input: string; output: string }> = [];

    const actions = buildEnginePinnedTokenQuickActions({
      symbol: 'SWAP.LTC',
      labels: {
        swapTo: (symbol) => `Swap to ${symbol}`,
        swap: 'Swap',
        withdrawTo: (symbol) => `Withdraw to ${symbol}`,
      },
      openSwap: (state) => swapCalls.push(state),
      openWithdraw: (inputSymbol, outputSymbol) =>
        withdrawCalls.push({ input: inputSymbol, output: outputSymbol }),
    });

    expect(actions?.primaryLabel).toBe('Swap to WAIV');
    actions?.onPrimary();
    expect(swapCalls[0]).toEqual({
      fromSymbol: 'SWAP.LTC',
      toSymbol: 'WAIV',
    });

    actions?.menuItems.find((item) => item.id === 'swap')?.onSelect();
    expect(swapCalls[1]).toEqual({ fromSymbol: 'SWAP.LTC' });

    actions?.menuItems.find((item) => item.id === 'withdraw')?.onSelect();
    expect(withdrawCalls[0]).toEqual({
      input: 'SWAP.LTC',
      output: 'LTC',
    });
  });

  it('returns null for disabled pegged symbols', () => {
    expect(
      buildEnginePinnedTokenQuickActions({
        symbol: 'SWAP.ETH',
        labels: {
          swapTo: (symbol) => `Swap to ${symbol}`,
          swap: 'Swap',
          withdrawTo: (symbol) => `Withdraw to ${symbol}`,
        },
        openSwap: () => undefined,
        openWithdraw: () => undefined,
      }),
    ).toBeNull();
  });
});
