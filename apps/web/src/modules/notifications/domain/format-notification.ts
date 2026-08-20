import {
  buildNotificationMessage,
  type NotificationIcon,
} from '@opden-data-layer/notifications-messages';
import type { NotificationEventType } from '@opden-data-layer/notifications-contract';
import type { UserNotificationItem } from '../infrastructure/notifications-ws-client';

export type NotificationIconType = 'follow' | 'vote' | 'reply' | 'wallet' | 'object' | 'bell' | 'generic';

export type FormattedNotification = {
  key: string;
  params?: Record<string, string>;
  href: string | null;
  actor: string | null;
  paramHrefs?: Readonly<Record<string, string>>;
};

function mapIcon(icon: NotificationIcon): NotificationIconType {
  return icon;
}

export function formatNotification(item: UserNotificationItem): FormattedNotification {
  const message = buildNotificationMessage({
    type: item.type as NotificationEventType,
    occurredAt: item.occurredAt,
    blockNum: item.blockNum,
    trxId: item.trxId,
    objectId: item.objectId,
    actor: item.actor,
    payload: item.payload,
  } as Parameters<typeof buildNotificationMessage>[0]);

  return {
    key: message.key,
    params: { ...message.params },
    href: message.href,
    actor: message.actor,
    paramHrefs: message.paramHrefs,
  };
}

export function resolveNotificationHref(
  item: UserNotificationItem,
  formatted: FormattedNotification,
  viewerUsername?: string,
): string | null {
  if (viewerUsername && (item.type === 'message_direct' || item.type === 'message_group')) {
    const channelId =
      typeof item.payload === 'object' &&
      item.payload !== null &&
      'channelId' in item.payload &&
      typeof (item.payload as { channelId?: string }).channelId === 'string'
        ? (item.payload as { channelId: string }).channelId
        : null;
    if (channelId) {
      return `/@${encodeURIComponent(viewerUsername)}/messages?channel=${encodeURIComponent(channelId)}`;
    }
  }
  return formatted.href;
}

export function notificationIconType(item: UserNotificationItem): NotificationIconType {
  const message = buildNotificationMessage({
    type: item.type as NotificationEventType,
    occurredAt: item.occurredAt,
    blockNum: item.blockNum,
    trxId: item.trxId,
    objectId: item.objectId,
    actor: item.actor,
    payload: item.payload,
  } as Parameters<typeof buildNotificationMessage>[0]);
  return mapIcon(message.icon);
}

/** Substitutes `{param}` placeholders in an i18n template string. */
export function applyNotificationParams(
  template: string,
  params?: Record<string, string>,
): string {
  if (!params) {
    return template;
  }
  let out = template;
  for (const [key, value] of Object.entries(params)) {
    out = out.replaceAll(`{${key}}`, value);
  }
  return out;
}
