/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

import { WalletCancelPowerDownModal } from './wallet-cancel-power-down-modal';

jest.mock('../../hooks/use-engine-token-broadcast', () => ({
  useEngineTokenBroadcast: () => ({
    broadcast: jest.fn(),
    pending: false,
    error: null,
  }),
}));

jest.mock('../../hooks/use-hive-broadcast', () => ({
  useHiveBroadcast: () => ({
    broadcast: jest.fn(),
    pending: false,
    error: null,
  }),
}));

const messages = {
  power_down: 'Power down',
  cancel_power_down: 'Cancel power down',
  cancel_power_down_body:
    'This will stop all remaining scheduled power down installments. Any HIVE already powered down will remain liquid.',
  cancel_power_down_confirm:
    'This will cancel the current power down request. Are you sure?',
  confirm: 'Confirm',
};

describe('WalletCancelPowerDownModal', () => {
  it('renders HIVE-specific title, body, and action label', () => {
    render(
      <I18nProvider locale="en-US" messages={messages}>
        <WalletCancelPowerDownModal
          open
          onClose={() => undefined}
          account="alice"
          state={{ kind: 'cancelPowerDown', asset: 'HIVE' }}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Cancel power down' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'This will stop all remaining scheduled power down installments. Any HIVE already powered down will remain liquid.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cancel power down' }),
    ).toBeInTheDocument();
  });

  it('keeps WAIV confirm copy', () => {
    render(
      <I18nProvider locale="en-US" messages={messages}>
        <WalletCancelPowerDownModal
          open
          onClose={() => undefined}
          account="alice"
          state={{ kind: 'cancelPowerDown', asset: 'WAIV' }}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Power down' })).toBeInTheDocument();
    expect(
      screen.getByText('This will cancel the current power down request. Are you sure?'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });
});
