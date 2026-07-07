import {
  getWalletTransferBalanceConfig,
  listWalletTransferAssetOptions,
} from './wallet-modal-balances';
import type { EngineWalletSummaryView } from './types/engine-wallet-view';

describe('wallet-modal-balances engine tokens', () => {
  const engineSummary: EngineWalletSummaryView = {
    account: 'alice',
    pinnedTokens: [
      {
        symbol: 'SWAP.HIVE',
        name: 'SWAP.HIVE',
        iconUrl: null,
        balance: '10',
        stake: '2',
        stakingEnabled: true,
        precision: 3,
        usdEstimate: 1,
        isPinned: true,
      },
    ],
    tokens: [
      {
        symbol: 'BEE',
        name: 'BEE',
        iconUrl: null,
        balance: '5',
        stake: '1',
        stakingEnabled: true,
        precision: 3,
        usdEstimate: 0.1,
        isPinned: false,
      },
    ],
    estimatedAccountValueUsd: 2,
    rates: { hiveUsd: 0.3 },
  };

  it('lists engine tokens for transfer options', () => {
    const options = listWalletTransferAssetOptions('none', null, null, engineSummary);
    expect(options).toContain('SWAP.HIVE');
    expect(options).toContain('BEE');
  });

  it('resolves max liquid balance for arbitrary engine symbol', () => {
    const config = getWalletTransferBalanceConfig(
      'BEE',
      'none',
      null,
      null,
      engineSummary,
    );
    expect(config?.maxAmount).toBe('5');
    expect(config?.validation).toBe('engine');
  });
});
