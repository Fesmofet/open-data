/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

import type { EngineTokenBalanceRowView } from '../../../domain/types/engine-wallet-view';
import { EngineWalletBalanceRow } from './engine-wallet-balance-row';

jest.mock('./engine-wallet-token-icon', () => ({
  EngineWalletTokenIcon: () => <div data-testid="token-icon" />,
}));

const token: EngineTokenBalanceRowView = {
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
};

const messages = {
  wallet_liquid_short: 'Liquid',
  wallet_staked_short: 'Staked',
};

describe('EngineWalletBalanceRow', () => {
  it('renders inline row actions when actions are provided', () => {
    render(
      <I18nProvider locale="en-US" messages={messages}>
        <EngineWalletBalanceRow
          token={token}
          actions={{
            primaryLabel: 'Swap to WAIV',
            onPrimary: () => undefined,
            menuItems: [
              { id: 'swap', label: 'Swap', onSelect: () => undefined },
              {
                id: 'withdraw',
                label: 'Withdraw to HIVE',
                onSelect: () => undefined,
              },
            ],
          }}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole('button', { name: 'Swap to WAIV' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Swap to WAIV menu' })).toBeInTheDocument();
  });

  it('omits action controls when actions are not provided', () => {
    render(
      <I18nProvider locale="en-US" messages={messages}>
        <EngineWalletBalanceRow token={{ ...token, balance: '0' }} />
      </I18nProvider>,
    );

    expect(screen.queryByRole('button', { name: /Swap to WAIV/i })).not.toBeInTheDocument();
  });
});
