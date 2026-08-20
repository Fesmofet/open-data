'use client';

import { useCallback, useState } from 'react';

import { canUseKeychainMemoCrypto } from '../infrastructure/memo-crypto-capability';
import { canViewerAttemptDecryptMessage } from '../domain/messaging.helpers';
import type { MessageItem } from '../domain/messaging.types';
import { decodeMessageWithKeychain } from '../infrastructure/keychain-memo-crypto.adapter';

export type DecryptMessageError = 'requires_keychain' | 'not_for_you' | 'failed';

export function useDecryptMessage(viewerUsername: string | null) {
  const [cache, setCache] = useState<Record<string, string>>({});

  const decryptMessage = useCallback(
    async (message: MessageItem): Promise<{ ok: true; text: string } | { ok: false; error: DecryptMessageError }> => {
      const viewer = viewerUsername?.trim();
      if (!viewer) {
        return { ok: false, error: 'requires_keychain' };
      }
      if (!canUseKeychainMemoCrypto()) {
        return { ok: false, error: 'requires_keychain' };
      }
      if (!message.encryption || !message.encrypted_body) {
        return { ok: false, error: 'failed' };
      }
      if (!canViewerAttemptDecryptMessage(message, viewer)) {
        return { ok: false, error: 'not_for_you' };
      }
      const cached = cache[message.message_id];
      if (cached) {
        return { ok: true, text: cached };
      }
      try {
        const text = await decodeMessageWithKeychain(viewer, message.encrypted_body);
        setCache((prev) => ({ ...prev, [message.message_id]: text }));
        return { ok: true, text };
      } catch {
        return { ok: false, error: 'failed' };
      }
    },
    [cache, viewerUsername],
  );

  const getDecryptedText = useCallback(
    (messageId: string): string | null => cache[messageId] ?? null,
    [cache],
  );

  return { decryptMessage, getDecryptedText };
}
