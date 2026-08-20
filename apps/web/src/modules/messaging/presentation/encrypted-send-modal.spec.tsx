/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import type { LocaleId, Messages } from '@/i18n/types';

import { EncryptedSendModal } from './encrypted-send-modal';

const getActiveProvider = jest.fn();
const probeKeychainMemoKey = jest.fn();
const encodeMessageWithKeychain = jest.fn();
const fetchMemoPublicKey = jest.fn();

jest.mock('@/modules/auth', () => ({
  useHydrateWalletProvider: jest.fn(),
  getWalletFacade: () => ({
    getActiveProvider,
  }),
}));

jest.mock('../infrastructure/keychain-memo-crypto.adapter', () => ({
  probeKeychainMemoKey: (...args: unknown[]) => probeKeychainMemoKey(...args),
  encodeMessageWithKeychain: (...args: unknown[]) => encodeMessageWithKeychain(...args),
}));

jest.mock('../infrastructure/memo-public-key.client', () => ({
  fetchMemoPublicKey: (...args: unknown[]) => fetchMemoPublicKey(...args),
}));

jest.mock('@/shared/presentation', () => ({
  AppModal: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  AppModalCloseButton: ({ onClose, ariaLabel }: { onClose: () => void; ariaLabel: string }) => (
    <button type="button" aria-label={ariaLabel} onClick={onClose}>
      Close
    </button>
  ),
}));

const messages = {
  messaging_encrypt_send_title: 'Send encrypted message',
  messaging_encrypt_select_recipient: 'Select recipient',
  messaging_encrypt_import_memo: 'Import memo key',
  messaging_encrypt_signer_one_way_info: 'Signer one-way only',
  messaging_encrypt_one_way_warning: 'One-way warning',
  messaging_encrypt_one_way_consent: 'Send one-way consent',
  messaging_encrypt_preview: 'Preview',
  messaging_encrypt_checking_memo: 'Checking memo key',
  messaging_encrypt_failed: 'Encrypt failed',
  messaging_message_one_way: 'One-way to {to}',
  messaging_message_encrypted: 'Encrypted',
  messaging_send: 'Send',
  cancel: 'Cancel',
  close: 'Close',
} as Messages;

function renderModal(
  props: Partial<React.ComponentProps<typeof EncryptedSendModal>> = {},
) {
  const onSendEncrypted = jest.fn().mockResolvedValue(undefined);
  render(
    <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
      <EncryptedSendModal
        open
        onClose={jest.fn()}
        channelKind="group"
        members={['alice', 'bob']}
        viewerUsername="alice"
        body="secret text"
        onSendEncrypted={onSendEncrypted}
        {...props}
      />
    </I18nProvider>,
  );
  return { onSendEncrypted };
}

describe('EncryptedSendModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getActiveProvider.mockReturnValue('keychain');
    probeKeychainMemoKey.mockResolvedValue(true);
    encodeMessageWithKeychain.mockResolvedValue('#5HQ7EncryptedPayload');
    fetchMemoPublicKey.mockResolvedValue({
      memo_public_key: 'STM8testMemoPublicKey123456789012345678901234',
    });
  });

  it('probes Keychain memo key when logged in with Keychain', async () => {
    renderModal({ peer: 'bob', channelKind: 'direct' });

    await waitFor(() => {
      expect(probeKeychainMemoKey).toHaveBeenCalledWith('alice');
    });
  });

  it('does not probe Keychain when logged in with HiveSigner', async () => {
    getActiveProvider.mockReturnValue('hivesigner');
    renderModal({ peer: 'bob', channelKind: 'direct' });

    await waitFor(() => {
      expect(screen.getByText('Signer one-way only')).toBeInTheDocument();
    });
    expect(probeKeychainMemoKey).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeEnabled();
  });

  it('uses ephemeral encrypt for HiveSigner after consent without Keychain encode', async () => {
    getActiveProvider.mockReturnValue('hivesigner');
    renderModal();

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'bob' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    await waitFor(() => {
      expect(encodeMessageWithKeychain).not.toHaveBeenCalled();
      expect(fetchMemoPublicKey).toHaveBeenCalledWith('bob');
    });
  });

  it('attempts Keychain encode first when logged in with Keychain', async () => {
    renderModal({ peer: 'bob', channelKind: 'direct' });

    await waitFor(() => {
      expect(probeKeychainMemoKey).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    await waitFor(() => {
      expect(encodeMessageWithKeychain).toHaveBeenCalledWith('alice', 'bob', 'secret text');
    });
  });

  it('enables preview when memo probe resolves false after delay', async () => {
    jest.useFakeTimers();
    probeKeychainMemoKey.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          window.setTimeout(() => resolve(false), 5000);
        }),
    );
    renderModal({ peer: 'bob', channelKind: 'direct' });

    expect(screen.getByRole('button', { name: 'Checking memo key' })).toBeDisabled();

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Preview' })).toBeEnabled();
    });

    jest.useRealTimers();
  });
});
