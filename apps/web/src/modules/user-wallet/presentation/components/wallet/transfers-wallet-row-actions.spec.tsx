/**
 * @jest-environment jsdom
 */
import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import { useEffectiveViewerUsername } from '@/modules/object-updates/application/use-effective-viewer-username';

import type { HiveWalletSummaryView } from '../../../domain/types/hive-wallet-view';
import type { WaivWalletSummaryView } from '../../../domain/types/waiv-wallet-view';
import { TransfersHiveWalletView } from './transfers-hive-wallet-view';
import { TransfersWaivWalletView } from './transfers-waiv-wallet-view';

jest.mock(
  '@/modules/object-updates/application/use-effective-viewer-username',
  () => ({
    useEffectiveViewerUsername: jest.fn(
      (username: string | null | undefined) => username ?? null,
    ),
  }),
);

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: ReactElement;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

jest.mock('../waiv/history/waiv-wallet-history-feed-client', () => ({
  WaivWalletHistoryFeedClient: () => null,
}));

jest.mock('../hive/history/hive-wallet-history-feed-client', () => ({
  HiveWalletHistoryFeedClient: () => null,
}));

jest.mock('../waiv/waiv-wallet-summary', () => ({
  WaivWalletSummary: ({
    canManageWallet,
  }: {
    canManageWallet: boolean;
  }) => (
    <div
      data-testid="waiv-summary"
      data-can-manage={String(canManageWallet)}
    />
  ),
}));

jest.mock('../hive/hive-wallet-summary', () => ({
  HiveWalletSummary: ({
    canManageWallet,
  }: {
    canManageWallet: boolean;
  }) => (
    <div
      data-testid="hive-summary"
      data-can-manage={String(canManageWallet)}
    />
  ),
}));

const mockUseEffectiveViewerUsername = jest.mocked(useEffectiveViewerUsername);

const messages = {
  table_view: 'Table view',
  unavailable: 'Unavailable',
  activity_error: 'Something went wrong',
};

const waivSummary = {
  account: 'alice',
  balance: {
    liquid: '10',
    stake: '100',
    delegationsIn: '0',
    delegationsOut: '0',
    pendingUnstake: '0',
    pendingUndelegations: '0',
  },
  display: {
    liquidWaiv: '10',
    waivPower: '100',
    delegationsNet: '0',
    estAccountValueUsd: '50',
  },
  flags: {
    showDelegationsRow: false,
    showPowerDownRow: false,
  },
  rates: {
    waivHive: 1,
    waivUsd: 0.1,
  },
} satisfies WaivWalletSummaryView;

const hiveSummary = {
  account: 'alice',
  balance: {
    liquidHive: '10',
    hivePower: '100',
    delegationsNetHp: '0',
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
    delegationsNetHp: '0',
    rcMax: '1k',
    hiveSavings: '0',
    hbdLiquid: '1',
    hbdSavings: '0',
    hbdInterest: '0',
    estAccountValueUsd: '50',
  },
  flags: {
    showDelegationsRow: false,
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
} satisfies HiveWalletSummaryView;

function renderWithI18n(ui: ReactElement) {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      {ui}
    </I18nProvider>,
  );
}

describe('transfers wallet row actions', () => {
  it('enables WAIV summary actions when effective viewer matches profile owner', () => {
    mockUseEffectiveViewerUsername.mockReturnValue('alice');

    renderWithI18n(
      <TransfersWaivWalletView
        accountName="alice"
        viewerUsername={null}
        waivSummary={waivSummary}
        waivError={null}
        hiveSummary={null}
      />,
    );

    expect(screen.getByTestId('waiv-summary')).toHaveAttribute(
      'data-can-manage',
      'true',
    );
  });

  it('enables HIVE summary actions when effective viewer matches profile owner', () => {
    mockUseEffectiveViewerUsername.mockReturnValue('alice');

    renderWithI18n(
      <TransfersHiveWalletView
        accountName="alice"
        viewerUsername={null}
        waivSummary={null}
        hiveSummary={hiveSummary}
        hiveError={null}
      />,
    );

    expect(screen.getByTestId('hive-summary')).toHaveAttribute(
      'data-can-manage',
      'true',
    );
  });

  it('disables summary actions for non-owners', () => {
    mockUseEffectiveViewerUsername.mockReturnValue('bob');

    renderWithI18n(
      <TransfersWaivWalletView
        accountName="alice"
        viewerUsername="bob"
        waivSummary={waivSummary}
        waivError={null}
        hiveSummary={null}
      />,
    );

    expect(screen.getByTestId('waiv-summary')).toHaveAttribute(
      'data-can-manage',
      'false',
    );
  });
});
