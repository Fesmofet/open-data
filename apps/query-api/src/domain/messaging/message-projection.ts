import type { Message } from '@opden-data-layer/odl-db-types';

export type MessageEncryptionDto = {
  v: number;
  mode: 'memo' | 'ephemeral';
  to: string;
};

export type MessageDto = {
  message_id: string;
  channel_id: string;
  author: string;
  body: string | null;
  encrypted_body: string | null;
  encryption: MessageEncryptionDto | null;
  overflow_ref: string | null;
  reply_to: string | null;
  quote_json: unknown;
  attachments: unknown;
  mentions: string[];
  created_at_unix: number;
  original_created_at_unix: number | null;
  updated_at_unix: number | null;
};

export function mapMessageToDto(row: Message): MessageDto {
  const encryption: MessageEncryptionDto | null =
    row.encryption_mode != null &&
    row.encrypted_to != null &&
    row.encryption_v != null &&
    (row.encryption_mode === 'memo' || row.encryption_mode === 'ephemeral')
      ? {
          v: row.encryption_v,
          mode: row.encryption_mode,
          to: row.encrypted_to,
        }
      : null;

  return {
    message_id: row.message_id,
    channel_id: row.channel_id,
    author: row.author,
    body: row.body,
    encrypted_body: row.encrypted_body,
    encryption,
    overflow_ref: row.overflow_ref,
    reply_to: row.reply_to,
    quote_json: row.quote_json,
    attachments: row.attachments,
    mentions: row.mentions,
    created_at_unix: row.created_at_unix,
    original_created_at_unix: row.original_created_at_unix,
    updated_at_unix: row.updated_at_unix,
  };
}

export type LastMessagePreviewResult = {
  preview: string | null;
  encrypted: boolean;
};

export function resolveLastMessagePreview(row: {
  body: string | null;
  overflow_ref: string | null;
  encryption_mode: string | null;
}): LastMessagePreviewResult {
  if (row.encryption_mode != null) {
    return { preview: null, encrypted: true };
  }
  if (row.body != null && row.body.trim() !== '') {
    return { preview: row.body, encrypted: false };
  }
  if (row.overflow_ref != null && row.overflow_ref.trim() !== '') {
    return { preview: row.overflow_ref, encrypted: false };
  }
  return { preview: null, encrypted: false };
}
