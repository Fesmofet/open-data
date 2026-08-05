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
  auth_keychain_has_sign_wait_title: 'Approve in Hive Keychain',
  auth_keychain_has_sign_wait_vote: 'Approve your vote in Hive Keychain.',
  auth_keychain_has_sign_wait_generic: 'Open Hive Keychain and approve the request.',
  auth_keychain_has_sign_wait_status: 'Waiting for approval…',
  auth_keychain_has_sign_wait_error_fallback: 'Broadcast failed. Please try again.',
  auth_keychain_has_mobile_hint: 'Tap the QR code or the link below to open Hive Keychain Mobile.',
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
  it('opens waiting modal with kind-specific copy', async () => {
    renderProvider();
    dispatchHasSignWait('vote');
    expect(await screen.findByText('Approve in Hive Keychain')).toBeInTheDocument();
    expect(screen.getByText('Approve your vote in Hive Keychain.')).toBeInTheDocument();
    expect(screen.getByText('Waiting for approval…')).toBeInTheDocument();
  });

  it('closes modal on success event', async () => {
    renderProvider();
    dispatchHasSignWait('vote');
    expect(await screen.findByText('Approve in Hive Keychain')).toBeInTheDocument();
    dispatchHasSignSuccess();
    await waitFor(() => {
      expect(screen.queryByText('Approve in Hive Keychain')).not.toBeInTheDocument();
    });
  });

  it('shows error state and closes on Close click', async () => {
    renderProvider();
    dispatchHasSignWait('vote');
    expect(await screen.findByText('Approve in Hive Keychain')).toBeInTheDocument();
    dispatchHasSignError('User rejected');
    expect(await screen.findByRole('alert')).toHaveTextContent('User rejected');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByText('Approve in Hive Keychain')).not.toBeInTheDocument();
    });
  });
});
