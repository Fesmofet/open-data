/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';

import type { MessageItem } from '../domain/messaging.types';
import { useDecryptMessage } from './use-decrypt-message';

const decodeMessageWithKeychain = jest.fn();
const getActiveProvider = jest.fn();

jest.mock('@/modules/auth', () => ({
  getWalletFacade: () => ({
    getActiveProvider,
  }),
}));

jest.mock('../infrastructure/keychain-memo-crypto.adapter', () => ({
  decodeMessageWithKeychain: (...args: unknown[]) => decodeMessageWithKeychain(...args),
}));

function memoMessage(overrides: Partial<MessageItem> = {}): MessageItem {
  return {
    message_id: 'msg-1',
    channel_id: 'dm-1',
    author: 'fesmofet',
    body: null,
    encrypted_body: '#5HQ7GhTabcdefghJKMNPQRSTUVWxyz',
    encryption: { v: 1, mode: 'memo', to: 'new-way' },
    overflow_ref: null,
    reply_to: null,
    quote_json: null,
    attachments: null,
    mentions: [],
    created_at_unix: 1_694_000_000,
    original_created_at_unix: null,
    ...overrides,
  };
}

describe('useDecryptMessage', () => {
  beforeEach(() => {
    decodeMessageWithKeychain.mockReset();
    decodeMessageWithKeychain.mockResolvedValue('hello world');
    getActiveProvider.mockReturnValue('keychain');
  });

  it('decrypts memo outgoing message for sender via Keychain', async () => {
    const { result } = renderHook(() => useDecryptMessage('fesmofet'));

    let outcome: Awaited<ReturnType<typeof result.current.decryptMessage>> | undefined;
    await act(async () => {
      outcome = await result.current.decryptMessage(memoMessage());
    });

    expect(outcome).toEqual({ ok: true, text: 'hello world' });
    expect(decodeMessageWithKeychain).toHaveBeenCalledWith(
      'fesmofet',
      '#5HQ7GhTabcdefghJKMNPQRSTUVWxyz',
    );
  });

  it('returns not_for_you for ephemeral outgoing without calling Keychain', async () => {
    const { result } = renderHook(() => useDecryptMessage('fesmofet'));

    let outcome: Awaited<ReturnType<typeof result.current.decryptMessage>> | undefined;
    await act(async () => {
      outcome = await result.current.decryptMessage(
        memoMessage({
          encryption: { v: 1, mode: 'ephemeral', to: 'new-way' },
        }),
      );
    });

    expect(outcome).toEqual({ ok: false, error: 'not_for_you' });
    expect(decodeMessageWithKeychain).not.toHaveBeenCalled();
  });

  it('returns not_for_you for group bystander without calling Keychain', async () => {
    const { result } = renderHook(() => useDecryptMessage('charlie'));

    let outcome: Awaited<ReturnType<typeof result.current.decryptMessage>> | undefined;
    await act(async () => {
      outcome = await result.current.decryptMessage(memoMessage());
    });

    expect(outcome).toEqual({ ok: false, error: 'not_for_you' });
    expect(decodeMessageWithKeychain).not.toHaveBeenCalled();
  });

  it('returns failed when Keychain decode fails after gate passes', async () => {
    decodeMessageWithKeychain.mockRejectedValue(new Error('Decode failed'));
    const { result } = renderHook(() => useDecryptMessage('new-way'));

    let outcome: Awaited<ReturnType<typeof result.current.decryptMessage>> | undefined;
    await act(async () => {
      outcome = await result.current.decryptMessage(memoMessage());
    });

    expect(outcome).toEqual({ ok: false, error: 'failed' });
    expect(decodeMessageWithKeychain).toHaveBeenCalled();
  });

  it('returns requires_keychain for hivesigner without calling Keychain', async () => {
    getActiveProvider.mockReturnValue('hivesigner');
    const { result } = renderHook(() => useDecryptMessage('new-way'));

    let outcome: Awaited<ReturnType<typeof result.current.decryptMessage>> | undefined;
    await act(async () => {
      outcome = await result.current.decryptMessage(memoMessage());
    });

    expect(outcome).toEqual({ ok: false, error: 'requires_keychain' });
    expect(decodeMessageWithKeychain).not.toHaveBeenCalled();
  });

  it('returns requires_keychain for hiveauth without calling Keychain', async () => {
    getActiveProvider.mockReturnValue('hiveauth');
    const { result } = renderHook(() => useDecryptMessage('new-way'));

    let outcome: Awaited<ReturnType<typeof result.current.decryptMessage>> | undefined;
    await act(async () => {
      outcome = await result.current.decryptMessage(memoMessage());
    });

    expect(outcome).toEqual({ ok: false, error: 'requires_keychain' });
    expect(decodeMessageWithKeychain).not.toHaveBeenCalled();
  });
});
