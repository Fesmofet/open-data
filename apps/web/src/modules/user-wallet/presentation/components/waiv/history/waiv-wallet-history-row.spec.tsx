/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import type { WaivWalletHistoryRowView } from '@/modules/user-wallet/domain/types/waiv-wallet-history-view';

import { WaivWalletHistoryRow } from './waiv-wallet-history-row';

jest.mock('@/shared/presentation', () => ({
  UserAvatar: ({ username }: { username: string }) => (
    <span data-testid="avatar">{username}</span>
  ),
}));

const messages: Record<string, string> = {
  bought: 'Bought',
  sold: 'Sold',
  lowercase_from: 'from',
  lowercase_to: 'to',
  curator_rewards: 'Curator rewards',
  author_rewards: 'Author rewards',
  comment_lowercase: 'comment',
  cancel_order_to_buy: 'Cancel order',
  cancel_order_to_sell: 'Cancel order',
  market_expired_to_buy: 'Market expired to buy',
  market_expired_to_sell: 'Market expired to sell',
  mining_rewards: 'Mining rewards',
  power_down_stopped: 'Power down',
  delegated_to: 'Delegated to',
  activity_to: 'to',
  activity_received: 'Received',
  activity_from: 'from',
  activity_transferred: 'Transferred',
};

function renderRow(row: WaivWalletHistoryRowView) {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      <WaivWalletHistoryRow row={row} />
    </I18nProvider>,
  );
}

describe('WaivWalletHistoryRow', () => {
  it('renders market buy with counterparty avatar and rate', () => {
    const row: WaivWalletHistoryRowView = {
      kind: 'market_trade',
      id: '1',
      timestamp: '2024-01-01T00:00:00Z',
      tokenAmount: {
        amount: '4.048',
        currency: 'WAIV',
        tone: 'positive',
        sign: '+',
      },
      hiveAmount: {
        amount: '1',
        currency: 'SWAP.HIVE',
        tone: 'negative',
        sign: '-',
      },
      isBuy: true,
      counterparty: 'seller',
      rateLabel: '0.247 per WAIV',
    };
    renderRow(row);
    expect(screen.getByText(/Bought from/)).toBeInTheDocument();
    expect(screen.getByTestId('avatar')).toHaveTextContent('seller');
    expect(screen.getByText('0.247 per WAIV')).toBeInTheDocument();
  });

  it('renders curation reward with compact amount', () => {
    const row: WaivWalletHistoryRowView = {
      kind: 'curation_reward',
      id: '2',
      timestamp: '2024-01-01T00:00:01Z',
      amountView: {
        amount: '0.00026',
        currency: 'WAIV',
        tone: 'positive',
        sign: '+',
      },
      authorperm: '@author/post-slug',
    };
    renderRow(row);
    expect(screen.getByText(/Curator rewards/)).toBeInTheDocument();
    expect(screen.getByText('+ 0.00026 WAIV')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '@author/post-slug' })).toBeInTheDocument();
  });

  it('renders delegate row with WP currency', () => {
    const row: WaivWalletHistoryRowView = {
      kind: 'delegate',
      id: '3',
      timestamp: '2024-01-01T00:00:02Z',
      amountView: {
        amount: '10',
        currency: 'WP',
        tone: 'neutral',
        sign: '-',
      },
      counterparty: 'bob',
      isIncoming: false,
    };
    renderRow(row);
    expect(screen.getByText(/Delegated to/)).toBeInTheDocument();
    expect(screen.getByText('- 10 WP')).toBeInTheDocument();
  });

  it('renders transfer with grouped thousands amount', () => {
    const row: WaivWalletHistoryRowView = {
      kind: 'transfer',
      id: '4',
      timestamp: '2024-01-01T00:00:03Z',
      direction: 'in',
      amountView: {
        amount: '1,000',
        currency: 'WAIV',
        tone: 'positive',
        sign: '+',
      },
      counterparty: 'waivio',
      memo: '',
    };
    renderRow(row);
    expect(screen.getByText('+ 1,000 WAIV')).toBeInTheDocument();
  });
});
