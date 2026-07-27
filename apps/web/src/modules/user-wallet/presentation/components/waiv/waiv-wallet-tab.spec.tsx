/**
 * @jest-environment jsdom
 */
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

import { WaivWalletTab } from './waiv-wallet-tab';

jest.mock('../wallet/transfers-waiv-wallet-view', () => ({
  TransfersWaivWalletView: () => <div data-testid="transfers-waiv-wallet-view" />,
}));

jest.mock('../wallet/wallet-modal-context', () => ({
  useWalletModal: () => ({
    openModal: jest.fn(),
    closeModal: jest.fn(),
    modal: null,
  }),
}));

const messages = {
  unavailable: 'Unavailable',
  activity_error: 'Something went wrong',
};

function renderTab(
  props: Partial<ComponentProps<typeof WaivWalletTab>> = {},
) {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      <WaivWalletTab
        accountName="alice"
        viewerUsername={null}
        summary={null}
        error="unavailable"
        {...props}
      />
    </I18nProvider>,
  );
}

describe('WaivWalletTab', () => {
  it('renders transfers waiv wallet view', () => {
    renderTab();
    expect(screen.getByTestId('transfers-waiv-wallet-view')).toBeInTheDocument();
  });

  it('renders with invalid_response error prop', () => {
    renderTab({ error: 'invalid_response' });
    expect(screen.getByTestId('transfers-waiv-wallet-view')).toBeInTheDocument();
  });
});
