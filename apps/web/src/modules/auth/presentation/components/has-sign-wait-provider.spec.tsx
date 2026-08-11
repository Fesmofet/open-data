/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import {
  dispatchHasSignError,
  dispatchHasSignSuccess,
  dispatchHasSignWait,
} from '@/modules/auth/infrastructure/has-sign-wait-events';

import { HasSignWaitProvider } from './has-sign-wait-provider';

const messages = {
  auth_keychain_has_sign_wait_title: 'Approve in the Hive Keychain app',
  auth_keychain_has_sign_wait_instruction:
    'Open the Hive Keychain app on your phone and approve the transaction request.',
  auth_keychain_has_sign_wait_status: 'Waiting for approval…',
  auth_keychain_has_sign_wait_error_fallback: 'Broadcast failed. Please try again.',
  cancel: 'Cancel',
  close: 'Close',
};

function renderProvider() {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      <HasSignWaitProvider />
    </I18nProvider>,
  );
}

describe('HasSignWaitProvider', () => {
  it('opens waiting modal with mobile approval copy', async () => {
    renderProvider();
    dispatchHasSignWait('vote');
    expect(await screen.findByText('Approve in the Hive Keychain app')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Open the Hive Keychain app on your phone and approve the transaction request.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Waiting for approval…')).toBeInTheDocument();
    expect(
      screen.queryByText(/QR code/i),
    ).not.toBeInTheDocument();
  });

  it('closes modal on success event', async () => {
    renderProvider();
    dispatchHasSignWait('vote');
    expect(await screen.findByText('Approve in the Hive Keychain app')).toBeInTheDocument();
    dispatchHasSignSuccess();
    await waitFor(() => {
      expect(screen.queryByText('Approve in the Hive Keychain app')).not.toBeInTheDocument();
    });
  });

  it('closes modal when Cancel is clicked while waiting', async () => {
    renderProvider();
    dispatchHasSignWait('transaction');
    expect(await screen.findByText('Approve in the Hive Keychain app')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(screen.queryByText('Approve in the Hive Keychain app')).not.toBeInTheDocument();
    });
  });

  it('shows error state and closes on Close click', async () => {
    renderProvider();
    dispatchHasSignWait('vote');
    expect(await screen.findByText('Approve in the Hive Keychain app')).toBeInTheDocument();
    dispatchHasSignError('User rejected');
    expect(await screen.findByRole('alert')).toHaveTextContent('User rejected');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByText('Approve in the Hive Keychain app')).not.toBeInTheDocument();
    });
  });
});
