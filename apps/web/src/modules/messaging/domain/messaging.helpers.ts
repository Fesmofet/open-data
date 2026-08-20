import { MAX_GROUP_CHANNEL_MEMBERS } from '@opden-data-layer/core/constants';
import { buildObjectChannelId } from '@opden-data-layer/core/utils/osl-messaging';
import {
  buildEncryptedMessageCreatePayload,
  buildGroupChannelCreatePayload,
  buildMessageCreatePayload,
  buildObjectChannelCreatePayload,
  generateGroupChannelId,
} from '@opden-data-layer/hive-broadcast';

import type { ChannelDetail, ChannelListItem, MessageItem } from './messaging.types';
import { EMPTY_LEAVE_POLICY, PLAIN_SEND_DISCLAIMER_STORAGE_KEY } from './messaging.types';

export {
  MAX_GROUP_CHANNEL_MEMBERS,
  buildObjectChannelId,
  generateGroupChannelId,
  buildGroupChannelCreatePayload,
  buildObjectChannelCreatePayload,
  buildMessageCreatePayload,
  buildEncryptedMessageCreatePayload,
};

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
    last_message_encrypted: false,
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
    members: listItem.members.map((account) => ({ account, role: 'member' as const })),
    viewer_role: 'admin',
    leave_policy: {
      can_leave: true,
      requires_successor: false,
      eligible_successors: [],
    },
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
  return sortChannelListItems([...byId.values()]);
}

export function sortChannelListItems(
  items: readonly ChannelListItem[],
): ChannelListItem[] {
  return [...items].sort((a, b) => {
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
    viewer_role: null,
    leave_policy: EMPTY_LEAVE_POLICY,
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

export type MessagePresentation =
  | { kind: 'plain'; text: string }
  | { kind: 'encrypted'; clickable: true }
  | { kind: 'one-way'; to: string }
  | { kind: 'decrypted'; text: string };

export function resolveMessagePresentation(
  message: Pick<MessageItem, 'body' | 'encryption' | 'author'>,
  viewerUsername: string | null,
  decryptedText?: string | null,
): MessagePresentation {
  if (decryptedText != null && decryptedText.length > 0) {
    return { kind: 'decrypted', text: decryptedText };
  }
  if (message.encryption == null) {
    return { kind: 'plain', text: messageDisplayBody(message) };
  }
  const viewer = viewerUsername?.trim().toLowerCase() ?? '';
  const outgoing =
    viewer.length > 0 && message.author.trim().toLowerCase() === viewer;
  if (outgoing && message.encryption.mode === 'ephemeral') {
    return { kind: 'one-way', to: message.encryption.to };
  }
  return { kind: 'encrypted', clickable: true };
}

export function canViewerAttemptDecryptMessage(
  message: Pick<MessageItem, 'encryption' | 'author'>,
  viewerUsername: string | null,
): boolean {
  if (message.encryption == null) {
    return false;
  }
  const viewer = viewerUsername?.trim().toLowerCase() ?? '';
  if (!viewer) {
    return false;
  }
  if (message.encryption.to.trim().toLowerCase() === viewer) {
    return true;
  }
  if (message.encryption.mode === 'memo') {
    return message.author.trim().toLowerCase() === viewer;
  }
  return false;
}

export function isPlainSendDisclaimerDismissed(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return localStorage.getItem(PLAIN_SEND_DISCLAIMER_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissPlainSendDisclaimer(): void {
  try {
    localStorage.setItem(PLAIN_SEND_DISCLAIMER_STORAGE_KEY, '1');
  } catch {
    // ignore
  }
}

export function buildChannelLeavePayload(input: {
  channelId: string;
  successorAdmin?: string;
  deleteMyMessages?: boolean;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    channel_id: input.channelId,
  };
  const successor = input.successorAdmin?.trim();
  if (successor) {
    payload.successor_admin = successor;
  }
  if (input.deleteMyMessages === true) {
    payload.delete_my_messages = true;
  }
  return payload;
}

export function buildChannelUpdatePayload(input: {
  channelId: string;
  title?: string;
  imageCid?: string;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    channel_id: input.channelId,
  };
  const title = input.title?.trim();
  if (title) {
    payload.title = title;
  }
  const cid = input.imageCid?.trim();
  if (cid) {
    payload.image = { cid };
  }
  if (payload.title === undefined && payload.image === undefined) {
    throw new Error('title or imageCid is required');
  }
  return payload;
}

export function buildChannelMemberAddPayload(input: {
  channelId: string;
  account: string;
}): Record<string, string> {
  return {
    channel_id: input.channelId,
    account: input.account.trim(),
  };
}

export function remainingGroupMemberSlots(currentMemberCount: number): number {
  return Math.max(0, MAX_GROUP_CHANNEL_MEMBERS - currentMemberCount);
}

export function canSelectMoreGroupMembers(
  currentMemberCount: number,
  additionalCount: number,
): boolean {
  return currentMemberCount + additionalCount <= MAX_GROUP_CHANNEL_MEMBERS;
}

export function resolveChannelImageUrl(
  image: unknown,
  contentBaseUrl?: string | null,
): string | null {
  if (image == null || typeof image !== 'object') {
    return null;
  }
  const record = image as Record<string, unknown>;
  if (typeof record.url === 'string' && record.url.trim() !== '') {
    return record.url.trim();
  }
  const cid = typeof record.cid === 'string' ? record.cid.trim() : '';
  if (cid && contentBaseUrl) {
    const base = contentBaseUrl.replace(/\/$/, '');
    return `${base}/ipfs-gateway/content/image/${cid}`;
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
