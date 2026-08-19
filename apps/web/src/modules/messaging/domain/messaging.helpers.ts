import type { ChannelDetail, ChannelListItem, MessageItem } from './messaging.types';

const GROUP_CHANNEL_ID_MAX_LENGTH = 256;
const GROUP_CHANNEL_ID_PREFIX = 'grp-';

/** Must stay in sync with `@opden-data-layer/core` `buildObjectChannelId`. */
export function buildObjectChannelId(objectId: string): string {
  return `obj-ch-${objectId}`;
}

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
    payload.title = title;
  }
  return payload;
}

export function buildOptimisticGroupChannelListItem(input: {
  channelId: string;
  members: readonly string[];
  viewerUsername: string;
  title?: string;
}): ChannelListItem {
  const viewer = input.viewerUsername.trim();
  const memberAccounts = [
    ...new Set(
      [viewer, ...input.members.map((member) => member.trim()).filter((member) => member.length > 0)],
    ),
  ];
  const title =
    input.title?.trim() ||
    memberAccounts
      .filter((account) => account !== viewer)
      .sort((a, b) => a.localeCompare(b))
      .join(' & ') ||
    input.channelId;

  return {
    channel_id: input.channelId,
    kind: 'group',
    display_title: title,
    list_title: title,
    peer: null,
    members: memberAccounts,
    last_message_at_unix: null,
    unread_count: 0,
    image: null,
    last_message_preview: null,
  };
}

export function buildOptimisticGroupChannelDetail(input: {
  channelId: string;
  members: readonly string[];
  viewerUsername: string;
  title?: string;
}): ChannelDetail {
  const listItem = buildOptimisticGroupChannelListItem(input);
  return {
    channel_id: listItem.channel_id,
    kind: 'group',
    creator: input.viewerUsername.trim(),
    title: input.title?.trim() || null,
    image: null,
    object_id: null,
    access: 'members_only',
    display_title: listItem.display_title,
    list_title: listItem.list_title,
    peer: null,
    members: listItem.members,
  };
}

export function mergeChannelListItems(
  serverItems: readonly ChannelListItem[],
  localItems: readonly ChannelListItem[],
): ChannelListItem[] {
  const byId = new Map<string, ChannelListItem>();
  for (const item of localItems) {
    byId.set(item.channel_id, item);
  }
  for (const item of serverItems) {
    byId.set(item.channel_id, item);
  }
  return [...byId.values()].sort((a, b) => {
    const aTs = a.last_message_at_unix;
    const bTs = b.last_message_at_unix;
    if (aTs == null && bTs == null) {
      return a.channel_id.localeCompare(b.channel_id);
    }
    if (aTs == null) {
      return -1;
    }
    if (bTs == null) {
      return 1;
    }
    if (bTs !== aTs) {
      return bTs - aTs;
    }
    return a.channel_id.localeCompare(b.channel_id);
  });
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
    payload.title = title;
  }
  return payload;
}

export function buildSyntheticObjectChannel(input: {
  objectId: string;
  objectName: string;
  viewerUsername?: string | null;
}): ChannelDetail {
  return {
    channel_id: buildObjectChannelId(input.objectId),
    kind: 'object',
    creator: input.viewerUsername?.trim() ?? '',
    title: input.objectName,
    image: null,
    object_id: input.objectId,
    access: 'members_only',
    display_title: input.objectName,
    list_title: null,
    peer: null,
    members: [],
  };
}

export function filterChannelsByUnread<T extends Pick<ChannelListItem, 'unread_count'>>(
  channels: readonly T[],
): T[] {
  return channels.filter((channel) => channel.unread_count > 0);
}

export function filterChannelsBySearch<T extends Pick<ChannelListItem, 'display_title' | 'list_title'>>(
  channels: readonly T[],
  query: string,
): T[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return [...channels];
  }
  return channels.filter((channel) => {
    const display = (channel.display_title ?? '').toLowerCase();
    const list = (channel.list_title ?? '').toLowerCase();
    return display.includes(needle) || list.includes(needle);
  });
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

export function resolveChannelImageUrl(image: unknown): string | null {
  if (image == null || typeof image !== 'object') {
    return null;
  }
  const record = image as Record<string, unknown>;
  if (typeof record.url === 'string' && record.url.trim() !== '') {
    return record.url.trim();
  }
  return null;
}

export function hiveAvatarUrl(username: string): string {
  return `https://images.hive.blog/u/${encodeURIComponent(username)}/avatar`;
}

export function messageDisplayBody(message: Pick<MessageItem, 'body' | 'overflow_ref'>): string {
  if (message.body != null && message.body.trim() !== '') {
    return message.body;
  }
  if (message.overflow_ref != null && message.overflow_ref.trim() !== '') {
    return message.overflow_ref;
  }
  return '';
}

export function isOutgoingMessage(
  message: Pick<MessageItem, 'author'>,
  viewerUsername: string | null,
): boolean {
  const viewer = viewerUsername?.trim().toLowerCase();
  if (!viewer) {
    return false;
  }
  return message.author.trim().toLowerCase() === viewer;
}

export type MessageDayGroup = {
  dayKey: string;
  label: string;
  messages: MessageItem[];
};

export function groupMessagesByDay(
  messages: readonly MessageItem[],
  formatDayLabel: (unix: number) => string,
): MessageDayGroup[] {
  const groups: MessageDayGroup[] = [];
  for (const message of messages) {
    const dayKey = new Date(message.created_at_unix * 1000).toISOString().slice(0, 10);
    const last = groups[groups.length - 1];
    if (last && last.dayKey === dayKey) {
      last.messages.push(message);
      continue;
    }
    groups.push({
      dayKey,
      label: formatDayLabel(message.created_at_unix),
      messages: [message],
    });
  }
  return groups;
}

export function canSendMessageBody(body: string): boolean {
  return body.trim().length > 0;
}
