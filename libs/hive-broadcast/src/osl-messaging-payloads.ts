import { buildObjectChannelId } from '@opden-data-layer/core/utils/osl-messaging';

const GROUP_CHANNEL_ID_MAX_LENGTH = 256;
const GROUP_CHANNEL_ID_PREFIX = 'grp-';

export function generateGroupChannelId(): string {
  const id = `${GROUP_CHANNEL_ID_PREFIX}${crypto.randomUUID()}`;
  if (id.length > GROUP_CHANNEL_ID_MAX_LENGTH) {
    throw new Error('group channel id exceeds max length');
  }
  return id;
}

export function buildGroupChannelCreatePayload(input: {
  channelId: string;
  members: readonly string[];
  title?: string;
  viewerUsername?: string;
}): Record<string, unknown> {
  const viewer = input.viewerUsername?.trim().toLowerCase();
  const members = [
    ...new Set(
      input.members
        .map((member) => member.trim())
        .filter((member) => member.length > 0)
        .filter((member) => member.toLowerCase() !== viewer),
    ),
  ];
  const payload: Record<string, unknown> = {
    kind: 'group',
    channel_id: input.channelId,
    members,
  };
  const title = input.title?.trim();
  if (title) {
    payload['title'] = title;
  }
  return payload;
}

export function buildObjectChannelCreatePayload(input: {
  objectId: string;
  objectName?: string;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    kind: 'object',
    channel_id: buildObjectChannelId(input.objectId),
    object_id: input.objectId,
  };
  const title = input.objectName?.trim();
  if (title) {
    payload['title'] = title;
  }
  return payload;
}

export function buildMessageCreatePayload(input: {
  channelId?: string;
  peer?: string;
  body: string;
}): Record<string, string> {
  const body = input.body.trim();
  if (input.channelId) {
    return { channel_id: input.channelId, body };
  }
  if (input.peer) {
    return { peer: input.peer, body };
  }
  throw new Error('channelId or peer is required');
}

export function buildEncryptedMessageCreatePayload(input: {
  channelId?: string;
  peer?: string;
  ciphertext: string;
  mode: 'memo' | 'ephemeral';
  to: string;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    encrypted_body: input.ciphertext,
    encryption: { v: 1, mode: input.mode, to: input.to },
  };
  if (input.channelId) {
    payload['channel_id'] = input.channelId;
  } else if (input.peer) {
    payload['peer'] = input.peer;
  } else {
    throw new Error('channelId or peer is required');
  }
  return payload;
}
