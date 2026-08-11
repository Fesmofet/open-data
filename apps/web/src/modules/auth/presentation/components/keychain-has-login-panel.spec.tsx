/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

import { KeychainHasLoginPanel } from './keychain-has-login-panel';

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,qr')),
}));

jest.mock('../../domain/device/is-mobile-browser', () => ({
  isMobileBrowser: () => false,
}));

const messages = {
  auth_keychain_has_instruction:
    'For full functionality, make sure your Hive Keychain account includes both Posting and Active keys.',
  auth_keychain_has_instruction_prefix:
    'For full functionality, make sure your Hive Keychain account includes both',
  auth_keychain_has_instruction_suffix: 'keys.',
  auth_keychain_has_instruction_posting: 'Posting',
  auth_keychain_has_instruction_active: 'Active',
  auth_keychain_has_step_open: 'Open the Hive Keychain app on your phone.',
  auth_keychain_has_step_open_emphasis: 'Open the Hive Keychain app',
  auth_keychain_has_step_open_rest: ' on your phone.',
  auth_keychain_has_step_scan: 'Scan the QR code below. Then approve the sign-in request.',
  auth_keychain_has_step_scan_emphasis: 'Scan the QR code below',
  auth_keychain_has_step_scan_rest: '. Then approve the sign-in request.',
  auth_keychain_has_or: 'or',
  auth_keychain_has_click_here: 'Open in Hive Keychain',
  auth_keychain_has_waiting: 'Waiting for sign-in approval…',
  auth_keychain_has_expired: 'Authentication request expired. Please try again.',
  cancel: 'Cancel',
};

function renderPanel(overrides: Partial<Parameters<typeof KeychainHasLoginPanel>[0]> = {}) {
  const onCancel = jest.fn();
  render(
    <I18nProvider locale="en-US" messages={messages}>
      <KeychainHasLoginPanel
        deepLink="has://auth_req/test"
        expiresAtMs={Date.now() + 60_000}
        pending={false}
        error={null}
        onCancel={onCancel}
        {...overrides}
      />
    </I18nProvider>,
  );
  return { onCancel };
}

describe('KeychainHasLoginPanel', () => {
  it('renders instruction callout and numbered steps', async () => {
    renderPanel();

    expect(
      screen.getByText(/For full functionality, make sure your Hive Keychain account includes both/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Posting')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Open the Hive Keychain app')).toHaveClass('font-weight-strong');
    expect(screen.getByText('Scan the QR code below')).toHaveClass('font-weight-strong');
  });

  it('renders bold step emphasis for non-en locales too', () => {
    render(
      <I18nProvider locale="ru-RU" messages={messages}>
        <KeychainHasLoginPanel
          deepLink="has://auth_req/test"
          expiresAtMs={Date.now() + 60_000}
          pending={false}
          error={null}
          onCancel={jest.fn()}
        />
      </I18nProvider>,
    );

    expect(screen.getByText('Open the Hive Keychain app')).toHaveClass('font-weight-strong');
    expect(screen.getByText('Scan the QR code below')).toHaveClass('font-weight-strong');
  });

  it('renders open-in-keychain button and waiting state', async () => {
    renderPanel({ pending: true });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Open in Hive Keychain' })).toBeInTheDocument();
    });
    expect(screen.getByText('Waiting for sign-in approval…')).toBeInTheDocument();
  });

  it('calls onCancel when cancel is clicked', async () => {
    const { onCancel } = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
