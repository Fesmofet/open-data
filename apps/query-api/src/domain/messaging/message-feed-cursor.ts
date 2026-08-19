import { z } from 'zod';

const messageCursorPayloadSchema = z.object({
  createdAtUnix: z.coerce.number().int(),
  eventSeq: z.coerce.string().transform((v) => BigInt(v)),
});

export type MessageCursorPayload = {
  createdAtUnix: number;
  eventSeq: bigint;
};

export function encodeMessageCursor(payload: MessageCursorPayload): string {
  return Buffer.from(
    JSON.stringify({
      createdAtUnix: payload.createdAtUnix,
      eventSeq: payload.eventSeq.toString(),
    }),
    'utf8',
  ).toString('base64url');
}

export function decodeMessageCursor(raw: string): MessageCursorPayload | null {
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(json);
    const result = messageCursorPayloadSchema.safeParse(parsed);
    if (!result.success) {
      return null;
    }
    return {
      createdAtUnix: result.data.createdAtUnix,
      eventSeq: result.data.eventSeq,
    };
  } catch {
    return null;
  }
}

const channelCursorPayloadSchema = z.object({
  lastMessageAtUnix: z.coerce.number().int(),
  channelId: z.string().min(1),
});

export type ChannelCursorPayload = z.infer<typeof channelCursorPayloadSchema>;

export function encodeChannelCursor(payload: ChannelCursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeChannelCursor(raw: string): ChannelCursorPayload | null {
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(json);
    const result = channelCursorPayloadSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
