/**
 * @jest-environment jsdom
 */
import type { ComponentProps, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

import { HiveWalletTab } from './hive-wallet-tab';

jest.mock('../wallet/transfers-hive-wallet-view', () => ({
  TransfersHiveWalletView: () => <div data-testid="transfers-hive-wallet-view" />,
}));

jest.mock('../wallet/unified-wallet-modal-host', () => ({
  UnifiedWalletModalHost: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock('../wallet/wallet-modal-context', () => ({
  useWalletModal: () => ({
    openModal: jest.fn(),
    closeModal: jest.fn(),
    modal: null,
  }),
}));

jest.mock('../../hooks/use-hive-broadcast', () => ({
  useHiveBroadcast: () => ({
    broadcast: jest.fn(),
    pending: false,
    error: null,
    setError: jest.fn(),
  }),
}));

const messages = {
  unavailable: 'Unavailable',
  activity_error: 'Something went wrong',
  hive_token: 'HIVE',
  liquid_hive_tokens: 'Liquid HIVE tokens',
  wallet_hive_power: 'HIVE Power',
  staked_hive_tokens: 'Staked HIVE tokens',
  resource_credits: 'Resource credits',
  wallet_resource_credits_info: 'Maximum resource credits',
  wallet_hive_delegations: 'HIVE Delegations',
  wallet_hive_delegations_info: 'Delegations',
  wallet_hive_savings: 'HIVE Savings',
  wallet_hive_savings_period: '3-day period',
  wallet_hbd_token: 'HBD',
  wallet_hbd_stable_info: 'Stable coin',
  wallet_hbd_savings: 'HBD Savings',
  wallet_hbd_savings_interest: 'APR',
  est_account_value: 'Est. Account Value',
  power_up: 'Power up',
  delegate: 'Delegate',
  deposit: 'Deposit',
  transfer: 'Transfer',
  withdraw: 'Withdraw',
  manage: 'Manage',
  delegate_rc: 'Delegate RC',
  transfer_to_savings_title: 'Transfer to savings',
  transfer_from_savings_title: 'Transfer from savings',
  next_power_down: 'Next power down',
};

const baseSummary = {
  account: 'alice',
  balance: {
    liquidHive: '10',
    hivePower: '100',
    delegationsNetHp: '5',
    rcMax: '1000',
    hiveSavings: '0',
    hbdLiquid: '1',
    hbdSavings: '0',
    hbdInterest: '0',
    toWithdrawHp: '0',
    vestingWithdrawRateHp: '0',
  },
  display: {
    liquidHive: '10',
    hivePower: '100',
    delegationsNetHp: '+5',
    rcMax: '1k',
    hiveSavings: '0',
    hbdLiquid: '1',
    hbdSavings: '0',
    hbdInterest: '0',
    estAccountValueUsd: '50',
  },
  flags: {
    showDelegationsRow: true,
    showPowerDownRow: false,
    showInterestRow: false,
    showHiveSavingsPending: false,
    showHbdSavingsPending: false,
    showRcDelegationsRow: false,
  },
  pendingSavingsWithdrawals: [],
  chain: {
    totalVestingShares: '1000000000 VESTS',
    totalVestingFundSteem: '500000000 HIVE',
  },
  rates: { hiveUsd: 0.25, hbdUsd: 1 },
} satisfies ComponentProps<typeof HiveWalletTab>['summary'];

function renderTab(props: Partial<ComponentProps<typeof HiveWalletTab>> = {}) {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      <HiveWalletTab
        accountName="alice"
        viewerUsername={null}
        summary={null}
        error="unavailable"
        {...props}
      />
    </I18nProvider>,
  );
}

describe('HiveWalletTab', () => {
  it('renders transfers hive wallet view', () => {
    renderTab();
    expect(screen.getByTestId('transfers-hive-wallet-view')).toBeInTheDocument();
  });

  it('passes summary through to transfers view', () => {
    renderTab({ summary: baseSummary, error: null });
    expect(screen.getByTestId('transfers-hive-wallet-view')).toBeInTheDocument();
  });
});
