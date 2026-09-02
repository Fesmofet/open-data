import type { MessageItem } from './messaging.types';
import { isOutgoingMessage } from './messaging.helpers';

export type MessageActionFlags = {
  edit: boolean;
  delete: boolean;
  copy: boolean;
  reply: boolean;
};

const NONE: MessageActionFlags = {
  edit: false,
  delete: false,
  copy: false,
  reply: false,
};

/**
 * Which message actions are available for a row (inbox + object Activity).
 * Uses on-chain `body` only — in-UI decrypt cache does not unlock copy/reply/edit.
 */
export function resolveMessageActions(
  message: Pick<MessageItem, 'author' | 'body' | 'encryption' | 'encrypted_body'>,
  viewerUsername: string | null,
): MessageActionFlags {
  const outgoing = isOutgoingMessage(message, viewerUsername);
  const hasPlainBody = message.body != null && message.body.trim() !== '';
  const isEncrypted =
    message.encryption != null ||
    (message.encrypted_body != null && message.encrypted_body.trim() !== '');

  if (hasPlainBody && !isEncrypted) {
    return {
      edit: outgoing,
      delete: outgoing,
      copy: true,
      reply: true,
    };
  }

  if (isEncrypted && outgoing) {
    return { edit: false, delete: true, copy: false, reply: false };
  }

  return NONE;
}
