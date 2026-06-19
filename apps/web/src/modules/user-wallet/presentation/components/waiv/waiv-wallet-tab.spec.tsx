/**
 * @jest-environment jsdom
 */
import type { ComponentProps, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

import { WaivWalletTab } from './waiv-wallet-tab';

jest.mock('../engine-token/wallet-modal-host', () => ({
  WalletModalHost: ({ children }: { children: ReactNode }) => <>{children}</>,
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
  it('shows unavailable when wallet data failed to load', () => {
    renderTab();
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('shows activity_error for invalid_response', () => {
    renderTab({ error: 'invalid_response' });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
