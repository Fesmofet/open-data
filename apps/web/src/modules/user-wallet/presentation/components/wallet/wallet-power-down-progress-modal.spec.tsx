/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

import { WalletPowerDownProgressModal } from './wallet-power-down-progress-modal';

const messages = {
  power_down: 'Power down',
  wallet_amount: 'Amount',
  next_power_down: 'Next power down:',
  wallet_power_down_installment: 'Power down #{number}',
  wallet_power_down_remaining: 'Remaining: {remaining} weeks out of {total}.',
  ok: 'OK',
};

function renderModal(
  props: Partial<React.ComponentProps<typeof WalletPowerDownProgressModal>> = {},
) {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      <WalletPowerDownProgressModal
        open
        onClose={() => undefined}
        title="Power down"
        amount="75"
        symbol="WP"
        nextDateLabel="8/11/2026, 3:37 PM"
        weeksRemaining={3}
        weeksTotal={4}
        {...props}
      />
    </I18nProvider>,
  );
}

describe('WalletPowerDownProgressModal', () => {
  it('renders legacy installment heading and muted detail rows', () => {
    renderModal();

    expect(screen.getByText('Power down #1')).toBeInTheDocument();
    expect(screen.getByText('Amount: 75 WP')).toBeInTheDocument();
    expect(
      screen.getByText('Next power down: 8/11/2026, 3:37 PM'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Remaining: 3 weeks out of 4\./)).toBeInTheDocument();
  });

  it('renders week step labels 0 through total', () => {
    renderModal({ weeksRemaining: 13, weeksTotal: 13 });
    for (let step = 0; step <= 13; step += 1) {
      expect(screen.getByText(String(step))).toBeInTheDocument();
    }
  });

  it('renders four-week WAIV progress steps', () => {
    renderModal({ weeksRemaining: 3, weeksTotal: 4, symbol: 'WP' });
    for (let step = 0; step <= 4; step += 1) {
      expect(screen.getByText(String(step))).toBeInTheDocument();
    }
  });

  it('shows clamped remaining weeks text', () => {
    renderModal({ weeksRemaining: 13_000_000, weeksTotal: 13 });
    expect(screen.getByText(/Remaining: 13 weeks out of 13\./)).toBeInTheDocument();
  });
});
